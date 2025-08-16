import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Room, RoomEvent, Track } from 'livekit-client';
import useAuthStore from '../../stores/AuthStore';
import apiClient from '../../config/axios';
import { useSTT } from '../../hooks/useSTT';
import { useEmotionDetection } from '../../hooks/useEmotionDetection';
import MediaTestScreen from './MediaTestScreen';

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

  // 설정 - URL에서 방 ID 추출 (한 번만 계산)
  const extractedFromUrl = useMemo(() => {
    const pathSegments = window.location.pathname.split('/');
    const extractedRoomId = pathSegments[pathSegments.length - 1] || 'test-room';
    console.log('URL에서 추출한 Room ID:', extractedRoomId);
    console.log('현재 URL:', window.location.pathname);
    console.log('Path segments:', pathSegments);
    return extractedRoomId;
  }, [window.location.pathname]);
  
  const roomName = roomCodeFromUrl || extractedFromUrl;
  // 실제 사용자 정보 사용: 로그인된 경우 사용자 ID, 게스트인 경우 닉네임
  const getUserIdentifier = () => {
    if (!isLoggedIn || !user) return '게스트';
    
    // userId (ssafysy) 사용 - 갈등 레포트에서 누가 말했는지 명확하게 표시
    return user.userId || user.username || user.loginId || `user-${user.id}`;
  };
  
  const [participantName, setParticipantName] = useState(getUserIdentifier());

  // 타이머 관련 상태
  const [callStartTime, setCallStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerInterval = useRef(null);
  const maxCallDuration = 30 * 60 * 1000; // 30분 (밀리초)

  // LiveKit 상태 
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConnectButton, setShowConnectButton] = useState(true); // 연결 버튼 표시 상태
  const [showMediaTest, setShowMediaTest] = useState(false); // 미디어 테스트 화면 표시 상태


  const [noiseSuppressionEnabled, setNoiseSuppressionEnabled] = useState(true);
  const [speakingParticipants, setSpeakingParticipants] = useState(new Set());
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);

  const [isMicOn, setIsMicOn] = useState(false);  // 초기 상태: OFF
  const [isCameraOn, setIsCameraOn] = useState(false);  // 초기 상태: OFF

  // 실제 통화에서 사용할 미디어 설정 (테스트에서 가져옴)
  const [activeCamera, setActiveCamera] = useState('');
  const [activeMicrophone, setActiveMicrophone] = useState('');
  const [activeNoiseSuppression, setActiveNoiseSuppression] = useState(true);

  // LiveKit URL
  const LIVEKIT_URL = window.location.hostname === 'localhost' 
    ? 'ws://localhost:7880'
    : 'wss://i13c209.p.ssafy.io/livekit';

  // 참조들
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  const remoteAudioRefs = useRef(new Map());
  const pendingVideoTracks = useRef(new Map());
  const pendingAudioTracks = useRef(new Map());

  // 실제 방 ID 얻기 (연결된 room 객체에서) - 메모이제이션으로 최적화
  const actualRoomId = useMemo(() => {
    const id = room?.name || roomName;
    console.log('actualRoomId 계산:', id, { roomName, roomObjectName: room?.name });
    return id;
  }, [room?.name, roomName]);

  // LiveKit 방 연결 함수 
  const connectToRoom = async (overrideSettings = null) => {
    // 매개변수로 전달된 설정이 있으면 사용, 없으면 현재 상태 사용
    const cameraEnabled = overrideSettings?.cameraEnabled ?? isCameraOn;
    const micEnabled = overrideSettings?.micEnabled ?? isMicOn;
    const cameraDeviceId = overrideSettings?.cameraDeviceId ?? activeCamera;
    const micDeviceId = overrideSettings?.micDeviceId ?? activeMicrophone;
    const noiseSuppression = overrideSettings?.noiseSuppression ?? activeNoiseSuppression;
    try {
      setError(null);
      setIsLoading(true);

      let accessToken;
      const identity = isGuestMode ? participantName : (isLoggedIn ? participantName : 'guest');
      
      try {
        if (isGuestMode || !isLoggedIn) {
          const response = await apiClient.post('/video-call/guest-token', {
            room: roomName,
            identity: identity,
            name: identity
          });

          accessToken = response.data.data.token;
        } else {
          const response = await apiClient.post(`/video-call/token?room=${encodeURIComponent(roomName)}`);
          accessToken = response.data.data.token;
        }
        
        // ConflictReportPage 접근용으로 토큰 저장
        localStorage.setItem(`conflict_report_token_${roomName}`, accessToken);
        console.log('갈등 레포트 접근용 토큰 저장 완료:', roomName);
      } catch (tokenError) {
        console.error('토큰 생성 실패:', tokenError);
        if (tokenError.response?.status === 404) {
          throw new Error('토큰 생성 API를 찾을 수 없습니다. 서버 연결을 확인해주세요.');
        } else if (tokenError.response?.status === 500) {
          throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          throw new Error('토큰 생성에 실패했습니다. 네트워크 연결을 확인해주세요.');
        }
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
      
      // 참가자 수 체크 (나 + 상대방 = 최대 2명)
      const totalParticipants = Array.from(newRoom.remoteParticipants.values()).length + 1; 
      if (totalParticipants > 2) {
        throw new Error('이미 2명이 참여 중입니다. 1:1 대화방은 최대 2명까지만 참여할 수 있습니다.');
      }

      // 이벤트 리스너 설정
      setupRoomEventListeners(newRoom);
      
      setRoom(newRoom);
      setIsConnected(true);

      // 기존 참가자들 처리 
      const remoteParticipants = Array.from(newRoom.remoteParticipants.values());
      setParticipants(remoteParticipants);

      // 기존 참가자 join
      remoteParticipants.forEach(participant => {
        console.log('기존 참가자 트랙 연결:', participant.identity);
        
        // 비디오 트랙 연결
        participant.videoTrackPublications.forEach(publication => {
          if (publication.track) {
            console.log('기존 참가자 비디오 트랙 발견:', participant.identity);
            const videoRef = remoteVideoRefs.current.get(participant.sid);
            if (videoRef?.current) {
              publication.track.attach(videoRef.current);
              console.log('기존 참가자 비디오 트랙 연결 완료:', participant.identity);
            } else {
              // 아직 ref가 없으면 pending에 저장
              pendingVideoTracks.current.set(participant.sid, publication.track);
              console.log('기존 참가자 비디오 트랙 pending 저장:', participant.identity);
            }
          }
        });

        // 오디오 트랙 연결
        participant.audioTrackPublications.forEach(publication => {
          if (publication.track) {
            console.log('기존 참가자 오디오 트랙 발견:', participant.identity);
            const audioRef = remoteAudioRefs.current.get(participant.sid);
            if (audioRef?.current) {
              publication.track.attach(audioRef.current);
              console.log('기존 참가자 오디오 트랙 연결 완료:', participant.identity);
            } else {
              // 아직 ref가 없으면 pending에 저장
              pendingAudioTracks.current.set(participant.sid, publication.track);
              console.log('기존 참가자 오디오 트랙 pending 저장:', participant.identity);
            }
          }
        });
      });

      // 미디어 테스트에서 설정한 상태에 따라 맞춤형 미디어 활성화
      try {
        const mediaConstraints = {};
        
        if (cameraEnabled) {
          mediaConstraints.video = {
            deviceId: cameraDeviceId && cameraDeviceId !== '' ? { exact: cameraDeviceId } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          };
        }
        
        if (micEnabled) {
          mediaConstraints.audio = {
            deviceId: micDeviceId && micDeviceId !== '' ? { exact: micDeviceId } : undefined,
            echoCancellation: true,
            noiseSuppression: noiseSuppression
          };
        }
        
        if (mediaConstraints.video || mediaConstraints.audio) {
          console.log('=== 테스트 설정으로 맞춤형 미디어 생성 ===');
          console.log('Media Constraints:', JSON.stringify(mediaConstraints, null, 2));
          console.log('Active Settings:', {
            cameraDeviceId,
            micDeviceId,
            noiseSuppression,
            cameraEnabled,
            micEnabled
          });
          
          const customStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
          console.log('사용자 미디어 스트림 생성 성공:', {
            videoTracks: customStream.getVideoTracks().length,
            audioTracks: customStream.getAudioTracks().length,
            videoTrackSettings: customStream.getVideoTracks()[0]?.getSettings(),
            audioTrackSettings: customStream.getAudioTracks()[0]?.getSettings()
          });
          
          // 로컬 비디오 엘리먼트에 스트림 연결
          if (localVideoRef.current && mediaConstraints.video && customStream.getVideoTracks().length > 0) {
            localVideoRef.current.srcObject = customStream;
            localVideoRef.current.muted = true;
            await localVideoRef.current.play().catch(console.error);
            console.log('로컬 비디오 ref 연결 완료');
          }
          
          // 비디오 트랙 publish
          if (mediaConstraints.video && customStream.getVideoTracks().length > 0) {
            const videoTrack = customStream.getVideoTracks()[0];
            console.log('비디오 트랙 publish 시도:', {
              trackId: videoTrack.id,
              trackLabel: videoTrack.label,
              trackSettings: videoTrack.getSettings(),
              trackState: videoTrack.readyState,
              trackEnabled: videoTrack.enabled
            });
            
            const videoPublication = await newRoom.localParticipant.publishTrack(videoTrack, {
              name: 'camera',
              simulcast: false
            });
            setLocalVideoTrack(videoPublication.track);
            console.log('맞춤형 비디오 트랙 publish 완료:', {
              publicationSid: videoPublication.sid,
              trackSid: videoPublication.track?.sid
            });
          } else if (mediaConstraints.video) {
            console.error('비디오 미디어 제약이 있지만 스트림에 비디오 트랙이 없음');
          }
          
          // 오디오 트랙 publish
          if (mediaConstraints.audio && customStream.getAudioTracks().length > 0) {
            const audioTrack = customStream.getAudioTracks()[0];
            const audioPublication = await newRoom.localParticipant.publishTrack(audioTrack, {
              name: 'microphone'
            });
            setLocalAudioTrack(audioPublication.track);
            console.log('맞춤형 오디오 트랙 publish 완료');
          }
        }
      } catch (mediaError) {
        console.error('맞춤형 미디어 활성화 실패:', mediaError);
        // 실패 시 기본 방법으로 fallback
        try {
          if (cameraEnabled) {
            await newRoom.localParticipant.setCameraEnabled(true);
          }
          if (micEnabled) {
            await newRoom.localParticipant.setMicrophoneEnabled(true);
          }
        } catch (fallbackError) {
          console.error('기본 미디어 활성화도 실패:', fallbackError);
        }
      }

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
      
      // 1:1 대화방 제한 체크 (나 + 상대방 = 최대 2명)
      const totalParticipants = Array.from(room.remoteParticipants.values()).length + 1; // +1은 나 자신
      if (totalParticipants > 2) {
        console.log('최대 인원 초과로 새 참가자를 거부합니다.');
        // 초과된 참가자에게 알림 (참가자 본인이 볼 수 있도록)
        if (participant.identity !== room.localParticipant.identity) {
          alert('이 대화방은 1:1 대화방으로 최대 2명까지만 참여할 수 있습니다.');
        }
        return;
      }
      
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
      
      if (track.kind === Track.Kind.Video) {
        const videoRef = remoteVideoRefs.current.get(participant.sid);
        if (videoRef?.current) {
          track.attach(videoRef.current);
        } else {
          pendingVideoTracks.current.set(participant.sid, track);
        }
      } else if (track.kind === Track.Kind.Audio) {
        const audioRef = remoteAudioRefs.current.get(participant.sid);
        if (audioRef?.current) {
          track.attach(audioRef.current);
        } else {
          pendingAudioTracks.current.set(participant.sid, track);
        }
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log('트랙 구독 해제됨:', track.kind, participant.identity);
    });

    // Speaking 감지를 위한 AudioLevelChanged 이벤트
    room.on(RoomEvent.AudioLevelChanged, (level, participant) => {
      if (level > 0.1) { // speaking threshold
        setSpeakingParticipants(prev => {
          const newSet = new Set(prev);
          if (participant) {
            newSet.add(participant.sid);
            // STT 화자 업데이트 알림
            window.dispatchEvent(new CustomEvent('speakerChanged', {
              detail: { 
                speakerId: participant.identity,
                participantSid: participant.sid,
                level: level
              }
            }));
          } else {
            // local participant speaking
            setIsLocalSpeaking(true);
            window.dispatchEvent(new CustomEvent('speakerChanged', {
              detail: { 
                speakerId: participantName,
                participantSid: 'local',
                level: level
              }
            }));
          }
          return newSet;
        });
      } else {
        // Not speaking anymore
        setSpeakingParticipants(prev => {
          const newSet = new Set(prev);
          if (participant) {
            newSet.delete(participant.sid);
          } else {
            setIsLocalSpeaking(false);
          }
          return newSet;
        });
      }
    });
  };

  // ✅ 수정된 코드 (Video)
  const createParticipantVideoRef = (participantSid) => {
    if (!remoteVideoRefs.current.has(participantSid)) {
      remoteVideoRefs.current.set(participantSid, React.createRef());
      
      const pendingVideoTrack = pendingVideoTracks.current.get(participantSid);
      if (pendingVideoTrack) {
        setTimeout(() => {
          const videoRef = remoteVideoRefs.current.get(participantSid);
          if (videoRef?.current) {
            pendingVideoTrack.attach(videoRef.current);
            // ✅ attach 성공 후 여기서 삭제해야 합니다.
            pendingVideoTracks.current.delete(participantSid); 
          }
        }, 100);
      }
    }
    return remoteVideoRefs.current.get(participantSid);
  };

  // ✅ 수정된 코드 (Audio)
  const createParticipantAudioRef = (participantSid) => {
    if (!remoteAudioRefs.current.has(participantSid)) {
      remoteAudioRefs.current.set(participantSid, React.createRef());
      
      const pendingAudioTrack = pendingAudioTracks.current.get(participantSid);
      if (pendingAudioTrack) {
        setTimeout(() => {
          const audioRef = remoteAudioRefs.current.get(participantSid);
          if (audioRef?.current) {
            pendingAudioTrack.attach(audioRef.current);
            console.log('[오디오 연결] pending 오디오 트랙 연결 완료:', participantSid);
            if (audioRef.current.muted) {
              audioRef.current.muted = false;
              console.log('[오디오 연결] muted 해제:', participantSid);
            }
            audioRef.current.play().catch(e => console.log('[오디오 연결] 자동재생 실패 (정상):', e));
            // ✅ attach 성공 후 여기서 삭제해야 합니다.
            pendingAudioTracks.current.delete(participantSid); 
          }
        }, 500);
      }
    }
    return remoteAudioRefs.current.get(participantSid);
  };

  // STT 훅 사용 (실제 방 ID 사용)
  const sttHook = useSTT(actualRoomId, participantName, room);
  const {
    sttEnabled, aiMediationEnabled, conversations,
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

    // 로그인 사용자도 연결 버튼 표시
    if (isLoggedIn && !isGuestMode) {
      setShowConnectButton(true);
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

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      console.log('[컴포넌트 언마운트] 리소스 정리 시작...');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      handleLeaveRoom();
    };
  }, []);

  // 로컬 비디오 연결
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      const mediaStream = new MediaStream([localVideoTrack.mediaStreamTrack]);
      localVideoRef.current.srcObject = mediaStream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(console.error);
      
      // 비디오 메타데이터가 로드되면 표정 분석 시작
      const handleLoadedMetadata = async () => {
        console.log('비디오 메타데이터 로드됨, 표정 분석 시작');
        await startEmotionDetection(localVideoRef.current);
      };
      
      localVideoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        if (localVideoRef.current) {
          localVideoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        }
      };
    } else if (!localVideoTrack && localVideoRef.current) {
      localVideoRef.current.srcObject = null;
      console.log('로컬 비디오 트랙 정리됨');
    }
  }, [localVideoTrack]);

  // 표정 분석 정리
  useEffect(() => {
    return () => {
      stopEmotionDetection();
    };
  }, []);

  // 마이크 상태에 따른 STT 자동 연동
  useEffect(() => {
    if (isMicOn && !sttEnabled) {
      console.log('마이크 켜짐 - STT 자동 시작');
      startSTT();
    } else if (!isMicOn && sttEnabled) {
      console.log('마이크 꺼짐 - STT 자동 중지');
      stopSTT();
    }
  }, [isMicOn, sttEnabled, startSTT, stopSTT]);

  // 갈등 레벨 분석
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
          handleLeaveRoom(true);
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

  // 게스트로 참가
  const handleGuestJoin = () => {
    if (!guestNickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    setParticipantName(guestNickname);
    setIsGuestMode(true);
    setShowGuestModal(false);
    setShowConnectButton(true);
  };

  // 연결 시작 버튼 클릭
  const handleStartConnection = () => {
    setShowConnectButton(false);
    setShowMediaTest(true);
  };

  // 미디어 테스트 완료 후 실제 연결
  const handleMediaTestComplete = async (settings) => {
    console.log('=== 테스트 설정 적용 ===', settings);
    
    setShowMediaTest(false);
    setCallStartTime(Date.now());
    
    // 상태 업데이트
    setIsCameraOn(settings.cameraEnabled);
    setIsMicOn(settings.micEnabled);
    setActiveCamera(settings.cameraDeviceId);
    setActiveMicrophone(settings.micDeviceId);
    setActiveNoiseSuppression(settings.noiseSuppression);
    
    // 연결 실행
    await connectToRoom(settings);
  };

  // 로그인 페이지로 이동
  const handleLogin = () => {
    window.location.href = '/login';
  };

  // 마이크 토글
  const toggleMicrophone = async () => {
    if (!room) return;

    try {
      if (isMicOn) {
        // 마이크 끄기
        await room.localParticipant.setMicrophoneEnabled(false);
        console.log('마이크 비활성화');
      } else {
        // 마이크 켜기 - 테스트에서 설정한 디바이스 및 옵션 사용
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: activeMicrophone && activeMicrophone !== '' ? { exact: activeMicrophone } : undefined,
              echoCancellation: true,
              noiseSuppression: activeNoiseSuppression
            }
          });
          
          const audioTrack = audioStream.getAudioTracks()[0];
          const audioPublication = await room.localParticipant.publishTrack(audioTrack, {
            name: 'microphone'
          });
          setLocalAudioTrack(audioPublication.track);
          console.log('맞춤형 마이크 활성화 완료');
        } catch (customError) {
          console.warn('맞춤형 마이크 활성화 실패, 기본 방법 사용:', customError);
          await room.localParticipant.setMicrophoneEnabled(true);
          
          const audioPublication = Array.from(room.localParticipant.audioTrackPublications.values())[0];
          if (audioPublication?.track) {
            setLocalAudioTrack(audioPublication.track);
          }
        }
      }
      setIsMicOn(!isMicOn);
    } catch (error) {
      console.error('마이크 토글 실패:', error);
      alert('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 접근을 허용해주세요.');
    }
  };

  // 비디오 토글
  const toggleVideo = async () => {
    if (!room) return;

    try {
      if (isCameraOn) {
        // 카메라 끄기
        await room.localParticipant.setCameraEnabled(false);
        setLocalVideoTrack(null);
        console.log('카메라 비활성화');
      } else {
        // 카메라 켜기 - 테스트에서 설정한 디바이스 사용
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: activeCamera && activeCamera !== '' ? { exact: activeCamera } : undefined,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
          
          const videoTrack = videoStream.getVideoTracks()[0];
          const videoPublication = await room.localParticipant.publishTrack(videoTrack, {
            name: 'camera',
            simulcast: false
          });
          setLocalVideoTrack(videoPublication.track);
          console.log('맞춤형 카메라 활성화 완료');
        } catch (customError) {
          console.warn('맞춤형 카메라 활성화 실패, 기본 방법 사용:', customError);
          await room.localParticipant.setCameraEnabled(true);
          
          setTimeout(() => {
            const videoPublication = Array.from(room.localParticipant.videoTrackPublications.values())[0];
            if (videoPublication?.track) {
              setLocalVideoTrack(videoPublication.track);
              console.log('기본 비디오 트랙 연결됨:', videoPublication.track);
            }
          }, 100);
        }
      }
      setIsCameraOn(!isCameraOn);
    } catch (error) {
      console.error('비디오 토글 실패:', error);
      alert('카메라 권한이 필요합니다. 브라우저 설정에서 카메라 접근을 허용해주세요.');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(8px)' }}>
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4 border border-orange-100">
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#333333' }}>화상채팅 참여</h2>
        <p className="text-gray-600 mb-6">
          게스트로 참여하거나 로그인하여 참여할 수 있습니다.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="guestNickname" className="block text-sm font-medium mb-2" style={{ color: '#333333' }}>
              닉네임
            </label>
            <input
              type="text"
              id="guestNickname"
              value={guestNickname}
              onChange={(e) => setGuestNickname(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleGuestJoin();
                }
              }}
              placeholder="닉네임을 입력하세요"
              className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200"
              style={{ 
                '--tw-ring-color': '#bf7d2c',
                focusRingColor: '#bf7d2c'
              }}
              autoFocus
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleGuestJoin}
              className="flex-1 text-white py-2 px-4 rounded-xl transition-all duration-200 shadow-lg font-medium"
              style={{ backgroundColor: '#bf7d2c' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#8B4513'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#bf7d2c'}
            >
              게스트로 참여
            </button>
            <button
              onClick={handleLogin}
              className="flex-1 bg-gray-200 py-2 px-4 rounded-xl transition-all duration-200 shadow font-medium"
              style={{ color: '#333333' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#e5e7eb'}
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 렌더링 로직 시작
  if (showGuestModal) {
    return <GuestModal />;
  }

  if (error) {
    return (
      <div className="min-h-screen relative" style={{ 
        zoom: '0.85',
        background: 'linear-gradient(135deg, #f8d6b3 0%, #fff 50%, #f5f2ed 100%)'
      }}>
        <div className="absolute inset-0">
          <div 
            className="absolute top-0 left-0 w-full" 
            style={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #83673f 0%, #cd9f6e 50%, #EE9278 100%)',
              opacity: 0.08
            }}
          ></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl text-center" style={{ border: '2px solid #f8d6b3' }}>
            <h2 className="text-2xl font-bold text-red-600 mb-4">연결 오류</h2>
            <p className="mb-6" style={{ color: '#666' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200 text-white shadow-lg"
              style={{ backgroundColor: '#83673f' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#7F5539'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#83673f'}
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showMediaTest) {
    return (
      <MediaTestScreen
        onTestComplete={handleMediaTestComplete}
        onCancel={() => {
          setShowMediaTest(false);
          setShowConnectButton(true);
        }}
        initialCameraEnabled={true}
        initialAudioEnabled={true}
      />
    );
  }

  if (showConnectButton && !isConnected && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative" style={{ zoom: '0.85' }}>
        <div className="absolute inset-0">
          <div 
            className="absolute top-0 left-0 w-full" 
            style={{ 
              height: '100%',
              background: 'linear-gradient(to bottom, rgba(255, 206, 157, 1), white)',
              opacity: 0.14
            }}
          ></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border border-orange-100 text-center">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#333333' }}>화상 회의 준비</h2>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">룸: <span className="font-semibold" style={{ color: '#bf7d2c' }}>{roomName}</span></p>
              <p className="text-gray-600">
                참가자: <span className="font-semibold" style={{ color: '#bf7d2c' }}>{isGuestMode ? `게스트 ${participantName}` : participantName}</span>
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleStartConnection}
                className="w-full px-6 py-3 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
                style={{ backgroundColor: '#bf7d2c' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#8B4513'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#bf7d2c'}
              >
                미디어 테스트
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-6 py-3 bg-gray-200 rounded-xl transition-all duration-200 shadow"
                style={{ color: '#333333' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative" style={{ zoom: '0.85' }}>
        <div className="absolute inset-0">
          <div 
            className="absolute top-0 left-0 w-full" 
            style={{ 
              height: '100%',
              background: 'linear-gradient(to bottom, rgba(255, 206, 157, 1), white)',
              opacity: 0.14
            }}
          ></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: '#bf7d2c' }}></div>
            <p className="text-xl font-medium" style={{ color: '#333333' }}>연결 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative flex flex-col overflow-hidden" style={{ zoom: '0.85' }}>
      <div className="absolute inset-0">
        <div 
          className="absolute top-0 left-0 w-full" 
          style={{ 
            height: '100%',
            background: 'linear-gradient(to bottom, rgb(248, 214, 179), white)',
            opacity: 0.14
          }}
        ></div>
      </div>
      
      {/* 헤더 */}
      <div className="relative z-10 bg-white/95 backdrop-blur-sm shadow-lg p-4 flex-shrink-0 border-b border-orange-200"> 
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: '#333333' }}>화상 회의</h1>
            <p className="text-sm text-gray-600">
              룸: {roomName} | {isGuestMode ? `게스트: ${participantName}` : `로그인: ${isLoggedIn ? '완료' : '필요'}`}
            </p>
          </div>
          
          {/* 타이머 표시 */}
          {isConnected && (
            <div className="text-center px-4">
              <div className="text-2xl font-bold text-[#5C351A]">
                {formatTime(elapsedTime).elapsed}
              </div>
              <div className={`text-sm ${
                elapsedTime >= 25 * 60 * 1000 ? 'text-red-500 animate-pulse' : 
                elapsedTime >= 20 * 60 * 1000 ? 'text-[#5C351A]' : 
                'text-[#4A4A4A]'
              }`}>
                {formatTime(elapsedTime).remaining}
              </div>
            </div>
          )}
          
          <div className="flex-1 text-right">
            <span className={`text-sm px-2 py-1 rounded ${
              isConnected ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-[#F2EDE2] text-[#4A4A4A] border border-[#5C351A]'
            }`}>
              {isConnected ? '● 연결됨' : '○ 연결 중...'}
            </span>
          </div>
        </div>
      </div>

      {/* 메인 비디오 영역 */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 비디오 그리드 */}
        <div className="flex-1 relative">
          <div className={`h-full grid gap-2 p-4 ${
            participants.length === 0 ? 'grid-cols-1' : 'grid-cols-2'
          }`}>
            
            {/* 로컬 비디오 */}
            <div className="relative bg-[#F2EDE2] rounded-lg overflow-hidden border border-[#5C351A] shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-[#FEFCF8] bg-opacity-90 text-[#2A2A2A] px-2 py-1 rounded text-sm shadow-lg border border-[#5C351A]">
                나 {isMicOn ? '🎤' : '🔇'} {isCameraOn ? '📹' : '📷'}
                {isLocalSpeaking && ' 🗣️'}
              </div>
              
              {/* 감정 표시 */}
              {emotionScores[participantName] && (
                <div className="absolute top-2 right-2 bg-[#F8F5F0] bg-opacity-90 text-[#5C351A] px-2 py-1 rounded text-xs shadow-lg border border-[#5C351A]">
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
              <div key={participant.sid} className="relative bg-[#F2EDE2] rounded-lg overflow-hidden border border-[#5C351A] shadow-lg">
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
                <div className="absolute bottom-2 left-2 bg-[#FEFCF8] bg-opacity-90 text-[#2A2A2A] px-2 py-1 rounded text-sm shadow-lg border border-[#5C351A]">
                  {participant.name} 
                  {participant.isAudioEnabled ? '🎤' : '🔇'} 
                  {participant.isVideoEnabled ? '📹' : '📷'}
                  {speakingParticipants.has(participant.sid) && ' 🗣️'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 사이드바 - AI 대화코치 */}
        <div className="w-80 bg-gradient-to-b from-[#F8F5F0] to-[#F2EDE2] flex flex-col h-full overflow-hidden border-l-4 border-[#5C351A] shadow-xl">
          {/* 감정 및 갈등 레벨 표시 */}
          <div className="p-3 border-b border-[#5C351A] flex-shrink-0 max-h-48 overflow-y-auto bg-[#FEFCF8] bg-opacity-50 rounded-lg m-2 shadow-sm">
            <h3 className="text-[#2A2A2A] font-bold mb-2 flex items-center">
              <span className="mr-2">🤖</span>AI 감정 분석
            </h3>
            <div className="mb-2">
              <div className="flex justify-between text-sm text-[#5C351A] font-medium">
                <span>갈등 레벨</span>
                <span>{Math.round(conflictLevel)}%</span>
              </div>
              <div className="w-full bg-[#D6CDB8] rounded-full h-2 shadow-inner">
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
              <div key={name} className="mb-2 bg-[#FEFCF8] bg-opacity-70 p-2 rounded shadow-sm">
                <p className="text-xs text-[#5C351A] font-semibold">{name}</p>
                <div className="grid grid-cols-3 gap-1 text-xs mt-1">
                  {Object.entries(scores).map(([emotion, score]) => (
                    <div key={emotion} className="text-center">
                      <div className={`${score > 50 ? 'text-red-600 font-semibold' : 'text-[#4A4A4A]'} text-xs`}>
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
            <div className="p-3 border-b border-[#5C351A] flex-shrink-0 bg-[#FEFCF8] bg-opacity-50 rounded-lg m-2 shadow-sm">
              <h3 className="text-[#2A2A2A] font-bold flex items-center">
                <span className="mr-2">💬</span>참견도치
              </h3>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={toggleSTT}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    sttEnabled ? 'bg-green-500 text-white shadow-lg' : 'bg-[#D6CDB8] text-[#4A4A4A] shadow'
                  }`}
                >
                  STT {sttEnabled ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={toggleAIMediation}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    aiMediationEnabled ? 'bg-[#5C351A] text-white shadow-lg border-2 border-[#4D280E]' : 'bg-[#D6CDB8] text-[#4A4A4A] shadow'
                  }`}
                >
                  AI 중재 {aiMediationEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {/* 대화 기록 */}
              {conversations.slice().reverse().map((conv) => {
                const isCoachingMessage = conv.isCoachingMessage || conv.speaker === '참견도치';
                
                return (
                  <div key={conv.id} className={`p-2 rounded-lg shadow border mb-2 ${
                    isCoachingMessage 
                      ? 'bg-gradient-to-r from-[#E8DCC0] to-[#F2EDE2] border-[#5C351A] border-2 shadow-lg'
                      : 'bg-[#FEFCF8] bg-opacity-80 border-[#5C351A]'
                  }`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm font-semibold flex items-center ${
                        isCoachingMessage ? 'text-[#4D280E]' : 'text-[#5C351A]'
                      }`}>
                        {isCoachingMessage ? (
                          <>
                            <span className="mr-2">🤖</span>
                            <span className="bg-[#5C351A] text-white px-2 py-1 rounded-full text-xs mr-2">참견중</span>
                            {conv.speaker}
                          </>
                        ) : (
                          <>
                            <span className="mr-2">👤</span>
                            {conv.speaker}
                          </>
                        )}
                      </span>
                      <span className="text-[#4A4A4A] text-xs">
                        {conv.timestamp}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      isCoachingMessage ? 'text-[#3E1F0A] font-medium' : 'text-[#2A2A2A]'
                    }`}>
                      {conv.text}
                    </p>
                    {conv.aiSuggestion && (
                      <div className="mt-3 p-3 bg-gradient-to-br from-[#5C351A] via-[#4D280E] to-[#3E1F0A] rounded-lg shadow-xl border-2 border-[#2A2A2A] relative">
                        <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#2A2A2A] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✨</span>
                        </div>
                        <p className="text-white text-xs font-bold flex items-center mb-1">
                          <span className="mr-1">🤖</span> 참견도치 조언
                        </p>
                        <p className="text-white text-sm font-medium leading-relaxed">{conv.aiSuggestion}</p>
                        <div className="mt-2 text-right">
                          <span className="text-[#F8F5F0] text-xs opacity-80">powered by AI</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 컨트롤 바 */}
      <div className="bg-[#FEFCF8] shadow-lg p-4 flex-shrink-0 border-t border-[#5C351A]">
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={toggleMicrophone}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors shadow-lg border-2`}
            style={{
              backgroundColor: isMicOn ? '#bf7d2c' : '#fed7aa',
              borderColor: isMicOn ? '#D2691E' : '#fdba74'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = isMicOn ? '#D2691E' : '#fdba74';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = isMicOn ? '#bf7d2c' : '#fed7aa';
            }}
            title={isMicOn ? '마이크 끄기' : '마이크 켜기'}
          >
            {isMicOn ? '🎤' : '🔇'}
          </button>

          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors shadow-lg border-2`}
            style={{
              backgroundColor: isCameraOn ? '#ea580c' : '#fed7aa',
              borderColor: isCameraOn ? '#c2410c' : '#fdba74'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = isCameraOn ? '#c2410c' : '#fdba74';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = isCameraOn ? '#ea580c' : '#fed7aa';
            }}
            title={isCameraOn ? '비디오 끄기' : '비디오 켜기'}
          >
            {isCameraOn ? '📹' : '📷'}
          </button>

          <button
            onClick={toggleNoiseSuppression}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg border-2`}
            style={{
              backgroundColor: noiseSuppressionEnabled ? '#bf7d2c' : '#fed7aa',
              borderColor: noiseSuppressionEnabled ? '#D2691E' : '#fdba74',
              color: noiseSuppressionEnabled ? 'white' : '#bf7d2c'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = noiseSuppressionEnabled ? '#D2691E' : '#fdba74';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = noiseSuppressionEnabled ? '#bf7d2c' : '#fed7aa';
            }}
            title={noiseSuppressionEnabled ? '소음 제거 ON' : '소음 제거 OFF'}
          >
            {noiseSuppressionEnabled ? '🔇' : '🔊'}
          </button>

          <button
            onClick={() => handleLeaveRoom(true)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors shadow-lg border-2"
            style={{
              backgroundColor: '#bf7d2c',
              borderColor: '#D2691E'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#D2691E'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#bf7d2c'}
          >
            📞
          </button>
        </div>

        <div className="flex justify-center mt-2 text-sm text-[#4A4A4A] font-medium">
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