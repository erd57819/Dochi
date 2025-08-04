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
  
  // 말하고 있는 참가자 추적 (Discord-like 기능)
  const [speakingParticipants, setSpeakingParticipants] = useState(new Set());
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  
  // 컨트롤 상태
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  
  // 설정 - URL에서 방 ID 추출
  const getRoomIdFromUrl = () => {
    const pathSegments = window.location.pathname.split('/');
    return pathSegments[pathSegments.length - 1] || 'test-room';
  };
  
  const roomName = getRoomIdFromUrl();
  const participantName = '사용자1';
  
  // LiveKit 서버 URL - nginx 프록시를 통해 연결
  const LIVEKIT_URL = 'wss://i13c209.p.ssafy.io/openvidu';
  // API Base URL을 상대 경로로 사용 (nginx 프록시를 통해 라우팅됨)
  const API_BASE_URL = '';
  
  // 로컬 비디오 ref
  const localVideoRef = useRef(null);
  
  // 오디오 분석용 refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const remoteAnalysersRef = useRef(new Map()); // 원격 참가자별 분석기 저장

  // 로컬 비디오 트랙 연결을 위한 useEffect
  useEffect(() => {
    if (localVideoRef.current && localVideoTrack) {
      console.log('비디오 트랙을 연결합니다:', localVideoTrack);
      console.log('비디오 트랙 상세:', {
        track: localVideoTrack.track,
        videoTrack: localVideoTrack.videoTrack,
        mediaStreamTrack: localVideoTrack.track?.mediaStreamTrack
      });
      
      try {
        // LiveKit에서는 track.mediaStreamTrack로 접근
        const actualTrack = localVideoTrack.track || localVideoTrack.videoTrack;
        if (actualTrack && actualTrack.mediaStreamTrack) {
          const stream = new MediaStream([actualTrack.mediaStreamTrack]);
          localVideoRef.current.srcObject = stream;
          // 명시적으로 play() 호출
          localVideoRef.current.play().catch(e => console.log('비디오 자동재생 제한:', e));
          console.log('비디오 트랙 연결 성공');
        } else if (localVideoTrack.mediaStreamTrack) {
          // 대체 방법
          const stream = new MediaStream([localVideoTrack.mediaStreamTrack]);
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(e => console.log('비디오 자동재생 제한:', e));
          console.log('대체 방법으로 비디오 트랙 연결 성공');
        } else {
          console.error('MediaStreamTrack을 찾을 수 없습니다');
        }
      } catch (error) {
        console.error('비디오 트랙 연결 실패:', error);
      }
    }
  }, [localVideoTrack]);

  // 컴포넌트 마운트시 정리만 등록 (자동 연결 제거)
  useEffect(() => {
    if (!isLoggedIn) {
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
        if (videoElement && track.mediaStreamTrack) {
          const stream = new MediaStream([track.mediaStreamTrack]);
          videoElement.srcObject = stream;
          // 명시적으로 play() 호출
          videoElement.play().catch(e => console.log('원격 비디오 자동재생 제한:', e));
        }
      } else if (track.kind === Track.Kind.Audio) {
        const audioElement = document.getElementById(`audio-${participant.identity}`);
        if (audioElement && track.mediaStreamTrack) {
          const stream = new MediaStream([track.mediaStreamTrack]);
          audioElement.srcObject = stream;
          
          // 원격 참가자 말하고 있는지 감지 설정
          setupRemoteAudioLevelDetection(track, participant.identity);
        }
      }
    });
    
    // 트랙 구독 해제
    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log('트랙 구독 해제:', track.kind, participant.identity);
      // MediaStream 방식에서는 srcObject를 null로 설정
      if (track.kind === Track.Kind.Video) {
        const videoElement = document.getElementById(`video-${participant.identity}`);
        if (videoElement) {
          videoElement.srcObject = null;
        }
      } else if (track.kind === Track.Kind.Audio) {
        const audioElement = document.getElementById(`audio-${participant.identity}`);
        if (audioElement) {
          audioElement.srcObject = null;
        }
      }
    });
    
    // 연결 해제
    room.on(RoomEvent.Disconnected, (reason) => {
      console.log('룸 연결 해제:', reason);
      setIsConnected(false);
      setParticipants([]);
      setSpeakingParticipants(new Set());
      setIsLocalSpeaking(false);
    });
    
    // 오디오 레벨 추적 (말하고 있는지 감지)
    room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      // 참가자별 오디오 레벨 체크
      const speaking = new Set();
      
      // 로컬 참가자 체크
      if (room.localParticipant.audioTracks.size > 0) {
        const localAudioTrack = Array.from(room.localParticipant.audioTracks.values())[0]?.track;
        if (localAudioTrack && localAudioTrack.isMuted === false) {
          // 실제 오디오 레벨은 복잡하므로 마이크가 켜져있으면 잠시 speaking으로 표시
          // 실제 구현에서는 Web Audio API를 사용해야 함
        }
      }
      
      // 원격 참가자들 체크
      room.remoteParticipants.forEach((participant) => {
        participant.audioTracks.forEach((publication) => {
          if (publication.track && !publication.isMuted) {
            // 오디오 트랙이 있고 음소거되지 않았으면 speaking으로 간주
            // 실제로는 오디오 레벨을 측정해야 함
          }
        });
      });
    });
  };

  // 토큰 서버에서 가져오기
  const getTokenFromServer = async (roomName) => {
    try {
      console.log('토큰 요청 시작...', { roomName, hasToken: !!token });
      
      const response = await fetch(`${API_BASE_URL}/dochi/video-call/token?room=${encodeURIComponent(roomName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // JWT 토큰이 있으면 Authorization 헤더 추가
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
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
      if (data.status === 200 && data.data) {
        // VideoCallRoomCreateResDto에서 token 가져오기
        return data.data.token;
      } else if (data.data && data.data.token) {
        // 대체 응답 구조
        return data.data.token;
      } else {  
        throw new Error('토큰 발급 실패: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('토큰 요청 실패:', error);
      throw error;
    }
  };

  // 오디오 레벨 감지를 위한 함수 (사용자 제스처 후에만 실행)
  const setupAudioLevelDetection = async (audioTrack) => {
    const actualTrack = audioTrack?.track || audioTrack?.audioTrack || audioTrack;
    const mediaStreamTrack = actualTrack?.mediaStreamTrack || audioTrack?.mediaStreamTrack;
    
    if (!mediaStreamTrack) {
      console.log('오디오 MediaStreamTrack을 찾을 수 없습니다:', audioTrack);
      return;
    }
    
    try {
      // AudioContext 생성 또는 기존 것 사용
      let audioContext = audioContextRef.current;
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
      }
      
      // AudioContext가 suspended 상태면 resume
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const analyser = audioContext.createAnalyser();
      const mediaStreamSource = audioContext.createMediaStreamSource(
        new MediaStream([mediaStreamTrack])
      );
      
      mediaStreamSource.connect(analyser);
      analyser.fftSize = 256;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      analyserRef.current = analyser;
      
      // 오디오 레벨 감지 루프
      const detectSpeaking = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // 평균 오디오 레벨 계산
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          const threshold = 20; // 말하고 있다고 판단하는 임계값
          
          setIsLocalSpeaking(average > threshold);
          
          animationFrameRef.current = requestAnimationFrame(detectSpeaking);
        }
      };
      
      detectSpeaking();
    } catch (error) {
      console.error('오디오 레벨 감지 설정 실패:', error);
    }
  };

  // 원격 참가자 오디오 레벨 감지 (기존 AudioContext 재사용)
  const setupRemoteAudioLevelDetection = async (audioTrack, participantId) => {
    const mediaStreamTrack = audioTrack?.mediaStreamTrack;
    if (!mediaStreamTrack) {
      console.log('원격 오디오 MediaStreamTrack을 찾을 수 없습니다:', participantId, audioTrack);
      return;
    }
    
    try {
      // 기존 AudioContext 사용 또는 새로 생성
      let audioContext = audioContextRef.current;
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
      }
      
      // AudioContext가 suspended 상태면 resume
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const analyser = audioContext.createAnalyser();
      const mediaStreamSource = audioContext.createMediaStreamSource(
        new MediaStream([mediaStreamTrack])
      );
      
      mediaStreamSource.connect(analyser);
      analyser.fftSize = 256;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // 원격 참가자별 분석기 저장
      remoteAnalysersRef.current.set(participantId, { audioContext, analyser });
      
      // 오디오 레벨 감지 루프
      const detectRemoteSpeaking = () => {
        if (analyser && remoteAnalysersRef.current.has(participantId)) {
          analyser.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          const threshold = 15; // 원격은 좀 더 낮은 임계값
          
          setSpeakingParticipants(prev => {
            const newSpeaking = new Set(prev);
            if (average > threshold) {
              newSpeaking.add(participantId);
            } else {
              newSpeaking.delete(participantId);
            }
            return newSpeaking;
          });
          
          requestAnimationFrame(detectRemoteSpeaking);
        }
      };
      
      detectRemoteSpeaking();
    } catch (error) {
      console.error('원격 오디오 레벨 감지 설정 실패:', error);
    }
  };

  // 로컬 미디어 활성화
  const enableLocalMedia = async (room) => {
    try {
      // 카메라 활성화
      const videoTrack = await room.localParticipant.setCameraEnabled(true);
      console.log('카메라 트랙 생성됨:', videoTrack);
      setLocalVideoTrack(videoTrack);
      
      // 마이크 활성화
      const audioTrack = await room.localParticipant.setMicrophoneEnabled(true);
      setLocalAudioTrack(audioTrack);
      
      // 오디오 레벨 감지 설정
      if (audioTrack) {
        setupAudioLevelDetection(audioTrack);
      }
      
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
        setLocalVideoTrack(videoTrack);
        
        if (localVideoRef.current) {
          if (videoTrack) {
            const actualTrack = videoTrack.track || videoTrack.videoTrack || videoTrack;
            if (actualTrack && actualTrack.mediaStreamTrack) {
              const stream = new MediaStream([actualTrack.mediaStreamTrack]);
              localVideoRef.current.srcObject = stream;
              // 명시적으로 play() 호출
              localVideoRef.current.play().catch(e => console.log('비디오 자동재생 제한:', e));
            } else if (videoTrack.mediaStreamTrack) {
              const stream = new MediaStream([videoTrack.mediaStreamTrack]);
              localVideoRef.current.srcObject = stream;
              localVideoRef.current.play().catch(e => console.log('비디오 자동재생 제한:', e));
            }
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
    // 오디오 분석 정리
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    // 원격 참가자 오디오 분석기 정리
    remoteAnalysersRef.current.forEach(({ audioContext }) => {
      audioContext.close();
    });
    remoteAnalysersRef.current.clear();
    
    if (room) {
      await room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setParticipants([]);
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
      setSpeakingParticipants(new Set());
      setIsLocalSpeaking(false);
      
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
            <h2 className="text-2xl font-bold mb-4">🎥 화상통화 시작</h2>
            <p className="text-lg mb-6">화상통화를 시작하려면 버튼을 클릭하세요</p>
            <button 
              onClick={joinRoom}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-white font-medium text-lg transition-colors"
            >
              📞 연결 시작
            </button>
            <p className="text-sm text-gray-400 mt-4">
              * 마이크와 카메라 권한이 필요합니다
            </p>
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
          <div className={`w-full h-64 bg-black rounded-lg relative overflow-hidden mb-4 transition-all duration-300 ${
            isLocalSpeaking && isMicOn ? 'ring-4 ring-green-400 ring-opacity-70 shadow-lg shadow-green-400/20' : ''
          }`}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className={`absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded ${
              isLocalSpeaking && isMicOn ? 'bg-green-600 bg-opacity-70' : ''
            }`}>
              <span className="text-sm">
                {isLocalSpeaking && isMicOn && '🎤 '}
                {participantName} (나)
              </span>
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
              {participants.map((participant) => {
                const isSpeaking = speakingParticipants.has(participant.identity);
                return (
                  <div key={participant.identity} className="relative">
                    <div className={`w-full h-48 bg-black rounded-lg relative overflow-hidden transition-all duration-300 ${
                      isSpeaking ? 'ring-4 ring-green-400 ring-opacity-70 shadow-lg shadow-green-400/20' : ''
                    }`}>
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
                      <div className={`absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs ${
                        isSpeaking ? 'bg-green-600 bg-opacity-70' : ''
                      }`}>
                        {isSpeaking && '🎤 '}
                        {participant.identity}
                      </div>
                    </div>
                  </div>
                );
              })}
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