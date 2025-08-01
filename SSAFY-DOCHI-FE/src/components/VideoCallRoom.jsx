import React, { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import useAuthStore from '../stores/AuthStore';

const VideoCallRoom = () => {
  // 인증 스토어에서 토큰 가져오기
  const { token, isLoggedIn } = useAuthStore();
  
  // 상태 관리
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [error, setError] = useState(null);
  
  // 컨트롤 상태
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  
  // 설정
  const roomName = 'test-room';
  const participantName = '사용자1';
  
  // LiveKit 서버 URL
  const LIVEKIT_URL = 'ws://localhost:7880';
  // API Base URL을 상대 경로로 사용 (nginx 프록시를 통해 라우팅됨)
  const API_BASE_URL = '';
  
  // 로컬 비디오 ref
  const localVideoRef = useRef(null);

  // 컴포넌트 마운트시 자동 참가
  useEffect(() => {
    if (isLoggedIn) {
      joinRoom();
    } else {
      setError('로그인이 필요합니다');
    }
    
    return () => {
      leaveRoom();
    };
  }, [isLoggedIn]);

  // 룸 참가 함수
  const joinRoom = async () => {
    try {
      console.log('룸 참가 시작...');
      setError(null);
      
      // 1. Room 객체 생성
      const newRoom = new Room();
      
      // 2. 이벤트 리스너 설정
      setupRoomEvents(newRoom);
      
      // 3. 백엔드에서 토큰 가져오기
      const liverkitToken = await getTokenFromServer(roomName);
      
      // 4. LiveKit 서버 연결
      await newRoom.connect(LIVEKIT_URL, liverkitToken);
      
      // 5. 로컬 미디어 활성화
      await enableLocalMedia(newRoom);
      
      setRoom(newRoom);
      setIsConnected(true);
      
      console.log('룸 연결 성공!');
      
    } catch (error) {
      console.error('룸 연결 실패:', error);
      setError(`연결 실패: ${error.message}`);
    }
  };

  // 룸 이벤트 설정
  const setupRoomEvents = (room) => {
    // 참가자 연결
    room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log('참가자 연결:', participant.identity);
      updateParticipants(room);
    });
    
    // 참가자 연결 해제
    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('참가자 연결 해제:', participant.identity);
      updateParticipants(room);
    });
    
    // 트랙 구독
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('트랙 구독:', track.kind, participant.identity);
      
      if (track.kind === Track.Kind.Video) {
        const videoElement = document.getElementById(`video-${participant.identity}`);
        if (videoElement) {
          track.attach(videoElement);
        }
      } else if (track.kind === Track.Kind.Audio) {
        const audioElement = document.getElementById(`audio-${participant.identity}`);
        if (audioElement) {
          track.attach(audioElement);
        }
      }
    });
    
    // 트랙 구독 해제
    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log('트랙 구독 해제:', track.kind, participant.identity);
      track.detach();
    });
    
    // 연결 해제
    room.on(RoomEvent.Disconnected, (reason) => {
      console.log('룸 연결 해제:', reason);
      setIsConnected(false);
      setParticipants([]);
    });
  };

  // 토큰 서버에서 가져오기
  const getTokenFromServer = async (roomName) => {
    try {
      console.log('토큰 요청 시작...', { roomName, hasToken: !!token });
      
      const response = await fetch(`${API_BASE_URL}/openvidu/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // JWT 토큰이 있으면 Authorization 헤더 추가
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: `room=${encodeURIComponent(roomName)}`
      });
      
      console.log('토큰 응답 상태:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('토큰 요청 에러:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('토큰 응답 데이터:', data);
      
      // 백엔드 응답 구조에 맞춰 수정
      if (data.success && data.data && data.data.token) {
        return data.data.token;
      } else {
        throw new Error('토큰 발급 실패: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('토큰 요청 실패:', error);
      throw error;
    }
  };

  // 로컬 미디어 활성화
  const enableLocalMedia = async (room) => {
    try {
      // 카메라 활성화
      const videoTrack = await room.localParticipant.setCameraEnabled(true);
      setLocalVideoTrack(videoTrack);
      
      // 로컬 비디오 연결
      if (localVideoRef.current && videoTrack) {
        videoTrack.attach(localVideoRef.current);
      }
      
      // 마이크 활성화
      const audioTrack = await room.localParticipant.setMicrophoneEnabled(true);
      setLocalAudioTrack(audioTrack);
      
    } catch (error) {
      console.error('미디어 활성화 실패:', error);
    }
  };

  // 참가자 목록 업데이트
  const updateParticipants = (room) => {
    const remoteParticipants = Array.from(room.remoteParticipants.values());
    setParticipants(remoteParticipants);
  };

  // 마이크 토글
  const toggleMicrophone = async () => {
    if (room) {
      try {
        await room.localParticipant.setMicrophoneEnabled(!isMicOn);
        setIsMicOn(!isMicOn);
      } catch (error) {
        console.error('마이크 토글 실패:', error);
      }
    }
  };

  // 카메라 토글
  const toggleCamera = async () => {
    if (room) {
      try {
        const videoTrack = await room.localParticipant.setCameraEnabled(!isCameraOn);
        setIsCameraOn(!isCameraOn);
        
        if (localVideoRef.current) {
          if (videoTrack) {
            videoTrack.attach(localVideoRef.current);
          } else {
            localVideoRef.current.srcObject = null;
          }
        }
      } catch (error) {
        console.error('카메라 토글 실패:', error);
      }
    }
  };

  // 룸 나가기
  const leaveRoom = async () => {
    if (room) {
      await room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setParticipants([]);
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
      
      // 로컬 비디오 정리
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }
  };

  // 로그인 안 된 경우
  if (!isLoggedIn) {
    return (
      <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">🦔 참견도치 화상통화</h1>
          <p className="text-lg mb-4">화상통화를 이용하려면 로그인이 필요합니다</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium"
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      {/* 헤더 */}
      <div className="bg-gray-800 p-4 text-white">
        <h1 className="text-xl font-bold">🦔 참견도치 화상통화 (LiveKit)</h1>
        <p className="text-sm text-gray-300">
          룸: {roomName} | 상태: {isConnected ? '연결됨' : '연결 안됨'} | 로그인: {isLoggedIn ? '완료' : '필요'}
        </p>
        {error && (
          <p className="text-red-400 text-sm mt-1">❌ {error}</p>
        )}
      </div>

      {/* 연결 상태 표시 */}
      {!isConnected && !error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>화상통화 연결 중...</p>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">❌</div>
            <p className="text-lg mb-4">{error}</p>
            <button 
              onClick={joinRoom}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 메인 비디오 영역 */}
      {isConnected && (
        <div className="flex-1 p-4">
          {/* 로컬 비디오 (나) */}
          <div className="w-full h-64 bg-black rounded-lg relative overflow-hidden mb-4">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded">
              <span className="text-sm">{participantName} (나)</span>
            </div>
            {!isCameraOn && (
              <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                <span className="text-white text-lg">📵 카메라 꺼짐</span>
              </div>
            )}
          </div>

          {/* 원격 참가자들 */}
          {participants.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {participants.map((participant) => (
                <div key={participant.identity} className="relative">
                  <div className="w-full h-48 bg-black rounded-lg relative overflow-hidden">
                    <video
                      id={`video-${participant.identity}`}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <audio
                      id={`audio-${participant.identity}`}
                      autoPlay
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      {participant.identity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 참가자 없을 때 메시지 */}
          {participants.length === 0 && (
            <div className="text-center text-gray-400 mt-8">
              <p>다른 참가자를 기다리는 중...</p>
              <p className="text-sm mt-2">다른 브라우저 탭에서 같은 URL로 접속해보세요!</p>
            </div>
          )}
        </div>
      )}

      {/* 컨트롤 바 */}
      <div className="bg-gray-800 p-4">
        <div className="flex justify-center gap-4">
          {/* 마이크 버튼 */}
          <button
            onClick={toggleMicrophone}
            disabled={!isConnected}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 ${
              isMicOn 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isMicOn ? '🎤' : '🔇'}
          </button>

          {/* 카메라 버튼 */}
          <button
            onClick={toggleCamera}
            disabled={!isConnected}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 ${
              isCameraOn 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isCameraOn ? '📹' : '📵'}
          </button>

          {/* 나가기 버튼 */}
          <button
            onClick={leaveRoom}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors"
          >
            📞
          </button>
        </div>
        
        {/* 상태 표시 */}
        <div className="flex justify-center mt-2 text-sm text-gray-400">
          <span>마이크: {isMicOn ? 'ON' : 'OFF'}</span>
          <span className="mx-2">|</span>
          <span>카메라: {isCameraOn ? 'ON' : 'OFF'}</span>
          <span className="mx-2">|</span>
          <span>참가자: {participants.length + 1}명</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCallRoom;