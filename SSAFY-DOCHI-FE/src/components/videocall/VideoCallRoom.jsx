import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Room, RoomEvent, Track } from 'livekit-client';
import useAuthStore from '../../stores/AuthStore';
import apiClient from '../../config/axios';
import { useSTT } from '../../hooks/useSTT';
import { useEmotionDetection } from '../../hooks/useEmotionDetection';

const VideoCallRoom = ({ userId, isHost, onEndCall }) => {
  // 인증 스토어에서 토큰과 사용자 정보 가져오기
  const { token, isLoggedIn, user } = useAuthStore();
  const navigate = useNavigate();
  const params = useParams();
  const roomCodeFromUrl = params.roomCode;

  // 게스트 모드 관련 상태
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestNickname, setGuestNickname] = useState('');
  const [showGuestModal, setShowGuestModal] = useState(false);

  // 설정 - URL에서 방 ID 추출
  const getRoomIdFromUrl = () => {
    const pathSegments = window.location.pathname.split('/');
    const extractedRoomId = pathSegments[pathSegments.length - 1] || 'test-room';
    console.log('URL에서 추출한 Room ID:', extractedRoomId);
    console.log('현재 URL:', window.location.pathname);
    console.log('Path segments:', pathSegments);
    return extractedRoomId;
  };
  
  const roomName = roomCodeFromUrl || getRoomIdFromUrl();
  console.log('최종 사용할 roomName:', roomName, { roomCodeFromUrl, extractedFromUrl: getRoomIdFromUrl() });
  // 실제 사용자 정보 사용: 로그인된 경우 사용자 ID, 게스트인 경우 닉네임
  const getUserIdentifier = () => {
    if (!isLoggedIn || !user) return '게스트';
    
    // userId (ssafysy) 사용 - 갈등 레포트에서 누가 말했는지 명확하게 표시
    return user.userId || user.username || user.loginId || `user-${user.id}`;
  };
  
  const [participantName, setParticipantName] = useState(getUserIdentifier());

  // 녹화 상태
  const [isRecording, setIsRecording] = useState(false);

  // 타이머 관련 상태
  const [callStartTime, setCallStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerInterval = useRef(null);
  const maxCallDuration = 30 * 60 * 1000; // 30분 (밀리초)

  // LiveKit 상태 (백업 파일 방식)
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [noiseSuppressionEnabled, setNoiseSuppressionEnabled] = useState(true);
  const [speakingParticipants, setSpeakingParticipants] = useState(new Set());
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // LiveKit URL
  const LIVEKIT_URL = window.location.hostname === 'localhost' 
    ? 'ws://localhost:7880'
    : 'wss://i13c209.p.ssafy.io/livekit';
  const API_BASE_URL = '';

  // 참조들
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  const remoteAudioRefs = useRef(new Map());
  const pendingVideoTracks = useRef(new Map());
  const pendingAudioTracks = useRef(new Map());

  // 실제 방 ID 얻기 (연결된 room 객체에서)
  const actualRoomId = room?.name || roomName;

  // LiveKit 방 연결 함수 (백업 파일 방식)
  const connectToRoom = async () => {
    try {
      setError(null);
      setIsLoading(true);

      let accessToken;
      const identity = isGuestMode ? participantName : (isLoggedIn ? participantName : 'guest');
      
      if (isGuestMode || !isLoggedIn) {
        const response = await fetch(`${API_BASE_URL}/api/video/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room: roomName,
            identity: identity
          }),
        });

        if (!response.ok) {
          throw new Error('토큰 생성에 실패했습니다');
        }

        const data = await response.json();
        accessToken = data.accessToken;
      } else {
        const response = await apiClient.post(`/video-call/token?room=${encodeURIComponent(roomName)}`);
        accessToken = response.data.data.token;
      }

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: false,
          videoCodec: 'h264'
        }
      });

      await newRoom.connect(LIVEKIT_URL, accessToken);
      
      // 로컬 트랙 활성화
      await newRoom.localParticipant.enableCameraAndMicrophone();
      
      // 트랙 참조 저장
      setLocalVideoTrack(newRoom.localParticipant.videoTrackPublications.values().next()?.value?.track);
      setLocalAudioTrack(newRoom.localParticipant.audioTrackPublications.values().next()?.value?.track);

      // 이벤트 리스너 설정
      setupRoomEventListeners(newRoom);
      
      setRoom(newRoom);
      setIsConnected(true);

      // 기존 참가자들 처리
      const remoteParticipants = Array.from(newRoom.remoteParticipants.values());
      setParticipants(remoteParticipants);

    } catch (error) {
      console.error('방 연결 실패:', error);
      setError(`연결 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 방 이벤트 리스너 설정
  const setupRoomEventListeners = (room) => {
    room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log('참가자 연결됨:', participant.identity);
      setParticipants(prev => [...prev, participant]);
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('참가자 연결 해제됨:', participant.identity);
      setParticipants(prev => prev.filter(p => p.sid !== participant.sid));
      
      // 1:1 통화에서 상대방이 나가면 자동으로 통화 종료 제안
      const remainingParticipants = Array.from(room.remoteParticipants.values());
      if (remainingParticipants.length === 0) {
        console.log('모든 참가자가 나갔습니다.');
        
        setTimeout(() => {
          const shouldExit = window.confirm(
            '상대방이 통화를 종료했습니다.\n\n' +
            '통화를 종료하시겠습니까?\n' +
            '(취소를 누르면 대기실에 남아있습니다)'
          );
          
          if (shouldExit) {
            handleLeaveRoom(true);
          } else {
            console.log('사용자가 대기실에 남기를 선택했습니다.');
          }
        }, 3000);
      }
    });

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('트랙 구독됨:', track.kind, participant.identity);
      attachTrack(track, participant);
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log('트랙 구독 해제됨:', track.kind, participant.identity);
    });
  };

  // 트랙 연결 함수
  const attachTrack = (track, participant) => {
    if (track.kind === Track.Kind.Video) {
      const videoRef = createParticipantVideoRef(participant.sid);
      if (videoRef?.current) {
        const mediaStream = new MediaStream([track.mediaStreamTrack]);
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.error);
      }
    } else if (track.kind === Track.Kind.Audio) {
      const audioRef = createParticipantAudioRef(participant.sid);
      if (audioRef?.current) {
        const mediaStream = new MediaStream([track.mediaStreamTrack]);
        audioRef.current.srcObject = mediaStream;
        audioRef.current.play().catch(console.error);
      }
    }
  };

  // STT 훅 사용 (실제 방 ID 사용)
  const sttHook = useSTT(actualRoomId, participantName);
  const {
    sttEnabled, aiMediationEnabled, conversations, currentSpeech,
    recognitionRef, speechTimeoutRef, conversationLogRef,
    toggleSTT, toggleAIMediation, stopSTT, startSTT, handleSpeechResult, sendSTTToFastAPI
  } = sttHook;

  // 감정인식 훅 사용 (실제 방 ID 사용)
  const emotionHook = useEmotionDetection(actualRoomId, participantName);
  const {
    emotionScores, conflictLevel,
    emotionAccumulatorRef, lastEmotionSentTimeRef,
    startEmotionDetection, stopEmotionDetection, updateEmotionScores,
    sendAccumulatedEmotionsToFastAPI, analyzeConflictLevel, generateEmotionAdvice,
    sendFinalEmotionData
  } = emotionHook;

  // 사용자 정보 변경 감지하여 participantName 업데이트
  useEffect(() => {
    const newParticipantName = getUserIdentifier();
    if (newParticipantName !== participantName) {
      setParticipantName(newParticipantName);
      console.log('Participant name 업데이트:', newParticipantName);
    }
  }, [isLoggedIn, user]);

  // 초기화 및 정리
  useEffect(() => {
    // 로그인 상태 확인
    if (!isLoggedIn && !isGuestMode) {
      setShowGuestModal(true);
      return;
    }

    // 로그인된 사용자 또는 게스트는 바로 룸 참가
    if (!room && (isLoggedIn || isGuestMode)) {
      console.log('룸 참가 시작...', { isLoggedIn, isGuestMode, participantName });
      connectToRoom();
      
      // 통화 시작 시간 기록
      setCallStartTime(Date.now());
    }

    return () => {
      handleLeaveRoom();
    };
  }, [isLoggedIn, isGuestMode, room]);

  // 페이지 언마운트시 정리 (브라우저 이벤트)
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('[페이지 종료] 리소스 정리 시작...');
      handleLeaveRoom();
    };

    const handlePopState = () => {
      console.log('[뒤로 가기] 리소스 정리 시작...');
      handleLeaveRoom();
    };

    // 상대방이 나갔을 때 처리
    const handleRemoteUserLeft = () => {
      console.log('[상대방 나감] 통화 종료 처리...');
      handleLeaveRoom(true); // 갈등 레포트로 이동
    };

    // 대기실 모드 처리
    const handleWaitingForUsers = () => {
      console.log('[대기 모드] 새로운 참가자를 기다립니다...');
      // 대기 중 메시지를 표시하거나 UI 업데이트
    };

    // 브라우저 종료/새로고침/뒤로가기 이벤트 처리
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('remoteUserLeft', handleRemoteUserLeft);
    window.addEventListener('waitingForUsers', handleWaitingForUsers);

    // 컴포넌트 언마운트시 정리
    return () => {
      console.log('[컴포넌트 언마운트] 리소스 정리 시작...');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('remoteUserLeft', handleRemoteUserLeft);
      window.removeEventListener('waitingForUsers', handleWaitingForUsers);
      handleLeaveRoom();
    };
  }, []);

  // 로컬 비디오 연결 (백업 파일 방식)
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      const mediaStream = new MediaStream([localVideoTrack.mediaStreamTrack]);
      localVideoRef.current.srcObject = mediaStream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(console.error);
    }
  }, [localVideoTrack]);

  // 표정 분석 시작 (로컬 비디오가 준비되면)
  useEffect(() => {
    if (localVideoRef.current && localVideoRef.current.videoWidth > 0) {
      startEmotionDetection(localVideoRef.current);
    }

    return () => {
      stopEmotionDetection();
    };
  }, [localVideoTrack, localVideoRef.current]);

  // 마이크 상태에 따른 STT 자동 연동
  useEffect(() => {
    if (isMicOn && !sttEnabled) {
      // 마이크가 켜지면 STT도 자동으로 시작
      console.log('마이크 켜짐 - STT 자동 시작');
      startSTT();
    } else if (!isMicOn && sttEnabled) {
      // 마이크가 꺼지면 STT도 자동으로 중지
      console.log('마이크 꺼짐 - STT 자동 중지');
      stopSTT();
    }
  }, [isMicOn, sttEnabled, startSTT, stopSTT]);

  // 갈등 레벨 분석 (감정 점수 변화 감지)
  useEffect(() => {
    analyzeConflictLevel(emotionScores);
  }, [emotionScores]);

  // 타이머 업데이트 및 30분 제한
  useEffect(() => {
    if (callStartTime && isConnected) {
      timerInterval.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - callStartTime;
        setElapsedTime(elapsed);

        // 30분 경과 시 자동 종료
        if (elapsed >= maxCallDuration) {
          console.log('[타이머] 30분 제한 도달 - 통화 종료');
          alert('통화 시간 30분이 경과하여 자동으로 종료됩니다.');
          handleLeaveRoom(true); // 갈등 레포트로 이동
        }

        // 25분 경과 시 경고
        if (elapsed >= 25 * 60 * 1000 && elapsed < 25 * 60 * 1000 + 1000) {
          alert('통화 시간이 5분 남았습니다.');
        }
      }, 1000);

      return () => {
        if (timerInterval.current) {
          clearInterval(timerInterval.current);
        }
      };
    }
  }, [callStartTime, isConnected]);

  // 시간 포맷 함수
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const remainingMinutes = 30 - minutes;
    
    return {
      elapsed: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      remaining: remainingMinutes > 0 ? `${remainingMinutes}분 남음` : '곧 종료'
    };
  };

  // 참가자 비디오 참조 생성
  const createParticipantVideoRef = (participantSid) => {
    if (!remoteVideoRefs.current.has(participantSid)) {
      remoteVideoRefs.current.set(participantSid, React.createRef());
      
      // 대기 중인 비디오 트랙이 있으면 연결
      const pendingVideoTrack = pendingVideoTracks.current.get(participantSid);
      if (pendingVideoTrack) {
        setTimeout(() => {
          const videoRef = remoteVideoRefs.current.get(participantSid);
          if (videoRef?.current) {
            videoRef.current.srcObject = pendingVideoTrack;
            videoRef.current.play().catch(console.error);
          }
        }, 100);
        pendingVideoTracks.current.delete(participantSid);
      }
    }
    return remoteVideoRefs.current.get(participantSid);
  };

  // 참가자 오디오 참조 생성
  const createParticipantAudioRef = (participantSid) => {
    if (!remoteAudioRefs.current.has(participantSid)) {
      remoteAudioRefs.current.set(participantSid, React.createRef());
      
      // 대기 중인 오디오 트랙이 있으면 연결
      const pendingAudioTrack = pendingAudioTracks.current.get(participantSid);
      if (pendingAudioTrack) {
        setTimeout(() => {
          const audioRef = remoteAudioRefs.current.get(participantSid);
          if (audioRef?.current) {
            audioRef.current.srcObject = pendingAudioTrack;
            audioRef.current.play().catch(console.error);
          }
        }, 100);
        pendingAudioTracks.current.delete(participantSid);
      }
    }
    return remoteAudioRefs.current.get(participantSid);
  };

  // 게스트로 참가
  const handleGuestJoin = () => {
    if (!guestNickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    setParticipantName(guestNickname);
    setIsGuestMode(true);
    setShowGuestModal(false);
    connectToRoom(); // 백업 파일 방식으로 직접 연결
  };

  // 로그인 페이지로 이동
  const handleLogin = () => {
    window.location.href = '/login';
  };

  // 녹화 토글
  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  // 마이크 토글
  const toggleMicrophone = async () => {
    if (!room) return;

    try {
      if (isMicOn) {
        await room.localParticipant.setMicrophoneEnabled(false);
      } else {
        await room.localParticipant.setMicrophoneEnabled(true);
      }
      setIsMicOn(!isMicOn);
    } catch (error) {
      console.error('마이크 토글 실패:', error);
    }
  };

  // 비디오 토글
  const toggleVideo = async () => {
    if (!room) return;

    try {
      if (isCameraOn) {
        await room.localParticipant.setCameraEnabled(false);
      } else {
        await room.localParticipant.setCameraEnabled(true);
      }
      setIsCameraOn(!isCameraOn);
    } catch (error) {
      console.error('비디오 토글 실패:', error);
    }
  };

  // 소음 억제 토글
  const toggleNoiseSuppression = () => {
    setNoiseSuppressionEnabled(!noiseSuppressionEnabled);
    console.log('소음 억제:', !noiseSuppressionEnabled ? 'ON' : 'OFF');
  };

  // 통합 룸 나가기 함수 (isEndCall: 종료버튼 클릭 여부)
  const handleLeaveRoom = async (isEndCall = false) => {
    // STT 정리
    stopSTT();

    // 표정 분석 정리
    stopEmotionDetection();

    // Room 연결 해제
    if (room) {
      await sendFinalEmotionData();
      room.disconnect();
      setRoom(null);
      setIsConnected(false);
    }

    // 종료 버튼 클릭 시에만 갈등 레포트로 이동
    if (isEndCall) {
      if (onEndCall) {
        onEndCall();
      } else {
        // onEndCall이 없으면 직접 갈등 레포트로 이동 (실제 방 ID 사용)
        navigate(`/conflict-report/${actualRoomId}`);
      }
    }
    // 뒤로가기나 페이지 이탈 시에는 단순히 리소스만 정리
  };

  // 게스트 모달 컴포넌트
  const GuestModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">화상채팅 참여</h2>
        <p className="text-gray-600 mb-6">
          게스트로 참여하거나 로그인하여 참여할 수 있습니다.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="guestNickname" className="block text-sm font-medium text-gray-700 mb-2">
              닉네임
            </label>
            <input
              type="text"
              id="guestNickname"
              value={guestNickname}
              onChange={(e) => setGuestNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleGuestJoin}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              게스트로 참여
            </button>
            <button
              onClick={handleLogin}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 로딩 및 에러 처리
  if (showGuestModal) {
    return <GuestModal />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">연결 오류</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">연결 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gray-800 p-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-white text-xl font-bold">화상 회의</h1>
            <p className="text-sm text-gray-300">
              룸: {roomName} | {isGuestMode ? `게스트: ${participantName}` : `로그인: ${isLoggedIn ? '완료' : '필요'}`}
            </p>
          </div>
          
          {/* 타이머 표시 */}
          {isConnected && (
            <div className="text-center px-4">
              <div className="text-2xl font-bold text-white">
                {formatTime(elapsedTime).elapsed}
              </div>
              <div className={`text-sm ${
                elapsedTime >= 25 * 60 * 1000 ? 'text-red-400 animate-pulse' : 
                elapsedTime >= 20 * 60 * 1000 ? 'text-yellow-400' : 
                'text-gray-400'
              }`}>
                {formatTime(elapsedTime).remaining}
              </div>
            </div>
          )}
          
          <div className="flex-1 text-right">
            <span className={`text-sm px-2 py-1 rounded ${
              isConnected ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              {isConnected ? '● 연결됨' : '○ 연결 중...'}
            </span>
          </div>
        </div>
      </div>

      {/* 메인 비디오 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 비디오 그리드 */}
        <div className="flex-1 relative">
          <div className={`h-full grid gap-2 p-4 ${
            participants.length === 0 ? 'grid-cols-1' :
            participants.length === 1 ? 'grid-cols-2' :
            'grid-cols-2 grid-rows-2'
          }`}>
            
            {/* 로컬 비디오 */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                나 {isMicOn ? '🎤' : '🔇'} {isCameraOn ? '📹' : '📷'}
                {isLocalSpeaking && ' 🗣️'}
              </div>
              
              {/* 감정 표시 */}
              {emotionScores[participantName] && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  {Object.entries(emotionScores[participantName])
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 1)
                    .map(([emotion, score]) => (
                      <span key={emotion}>
                        {emotion}: {score}%
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* 원격 참가자 비디오 */}
            {participants.map((participant) => (
              <div key={participant.sid} className="relative bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={createParticipantVideoRef(participant.sid)}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <audio
                  ref={createParticipantAudioRef(participant.sid)}
                  autoPlay
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {participant.name} 
                  {participant.isAudioEnabled ? '🎤' : '🔇'} 
                  {participant.isVideoEnabled ? '📹' : '📷'}
                  {speakingParticipants.has(participant.sid) && ' 🗣️'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 사이드바 - 대화 및 감정 정보 */}
        <div className="w-80 bg-gray-800 flex flex-col h-full overflow-hidden">
          {/* 감정 및 갈등 레벨 표시 */}
          <div className="p-4 border-b border-gray-700 flex-shrink-0 max-h-64 overflow-y-auto">
            <h3 className="text-white font-semibold mb-2">감정 상태</h3>
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>갈등 레벨</span>
                <span>{Math.round(conflictLevel)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    conflictLevel > 70 ? 'bg-red-500' :
                    conflictLevel > 40 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${conflictLevel}%` }}
                />
              </div>
            </div>
            
            {Object.entries(emotionScores).map(([name, scores]) => (
              <div key={name} className="mb-2">
                <p className="text-xs text-gray-400">{name}</p>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  {Object.entries(scores).map(([emotion, score]) => (
                    <div key={emotion} className="text-center">
                      <div className={`text-${score > 50 ? 'red' : 'gray'}-400`}>
                        {emotion}: {score}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 대화 내용 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
              <h3 className="text-white font-semibold">실시간 대화</h3>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={toggleSTT}
                  className={`px-3 py-1 rounded text-sm ${
                    sttEnabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  STT {sttEnabled ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={toggleAIMediation}
                  className={`px-3 py-1 rounded text-sm ${
                    aiMediationEnabled ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  AI 중재 {aiMediationEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {/* 현재 음성 */}
              {currentSpeech.text && (
                <div className="bg-blue-900 bg-opacity-50 p-3 rounded">
                  <p className="text-blue-300 text-sm font-medium">
                    {currentSpeech.speaker} (실시간)
                  </p>
                  <p className="text-white">{currentSpeech.text}</p>
                </div>
              )}

              {/* 대화 기록 */}
              {conversations.map((conv) => (
                <div key={conv.id} className="bg-gray-700 p-3 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-green-400 text-sm font-medium">
                      {conv.speaker}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {conv.timestamp}
                    </span>
                  </div>
                  <p className="text-white text-sm">{conv.text}</p>
                  {conv.aiSuggestion && (
                    <div className="mt-2 p-2 bg-purple-900 bg-opacity-50 rounded">
                      <p className="text-purple-300 text-xs">AI 조언:</p>
                      <p className="text-purple-100 text-sm">{conv.aiSuggestion}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 컨트롤 바 */}
      <div className="bg-gray-800 p-4 flex-shrink-0">
        <div className="flex justify-center items-center space-x-4">
          {/* 마이크 토글 */}
          <button
            onClick={toggleMicrophone}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
              isMicOn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
            title={isMicOn ? '마이크 끄기' : '마이크 켜기'}
          >
            {isMicOn ? '🎤' : '🔇'}
          </button>

          {/* 비디오 토글 */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
              isCameraOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
            }`}
            title={isCameraOn ? '비디오 끄기' : '비디오 켜기'}
          >
            {isCameraOn ? '📹' : '📷'}
          </button>

          {/* 녹화 토글 */}
          <button
            onClick={toggleRecording}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
              isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title={isRecording ? '녹화 중지' : '녹화 시작'}
          >
            {isRecording ? '⏹️' : '⏺️'}
          </button>

          {/* 소음 억제 토글 */}
          <button
            onClick={toggleNoiseSuppression}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
              noiseSuppressionEnabled
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title={noiseSuppressionEnabled ? '소음 제거 ON' : '소음 제거 OFF'}
          >
            {noiseSuppressionEnabled ? '🔇' : '🔊'}
          </button>

          {/* 나가기 버튼 */}
          <button
            onClick={() => handleLeaveRoom(true)}
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
          <span>STT: {sttEnabled ? 'ON' : 'OFF'}</span>
          {aiMediationEnabled && (
            <>
              <span className="mx-2">|</span>
              <span>AI 중재: ON</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCallRoom;