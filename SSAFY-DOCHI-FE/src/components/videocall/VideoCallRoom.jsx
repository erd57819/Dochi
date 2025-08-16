import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Room, RoomEvent, Track } from 'livekit-client';
import useAuthStore from '../../stores/AuthStore';
import apiClient from '../../config/axios';
import { useSSESTT } from '../../hooks/useSSESTT';
import { useEmotionDetection } from '../../hooks/useEmotionDetection';
import ConversationSidebar from './ConversationSidebar';

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

  // 미디어 테스트 관련 상태
  const [testStream, setTestStream] = useState(null);
  const [testVideoEnabled, setTestVideoEnabled] = useState(true);
  const [testAudioEnabled, setTestAudioEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [mediaDevices, setMediaDevices] = useState({ cameras: [], microphones: [], speakers: [] });
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMicrophone, setSelectedMicrophone] = useState('');

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
  const testVideoRef = useRef(null); // 미디어 테스트용 비디오 참조
  const testAudioContextRef = useRef(null); // 오디오 레벨 측정용
  const testAnalyserRef = useRef(null);
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
      const remoteParticipants = Array.from(newRoom.remoteParticipants.values()).map(participant => ({
        ...participant,
        isAudioEnabled: participant.audioTrackPublications.size > 0 && 
                       Array.from(participant.audioTrackPublications.values()).some(pub => pub.isMuted === false),
        isVideoEnabled: participant.videoTrackPublications.size > 0 && 
                       Array.from(participant.videoTrackPublications.values()).some(pub => pub.isMuted === false)
      }));
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

  // 참가자 상태 업데이트 함수
  const updateParticipantStatus = (participant) => {
    setParticipants(prev => prev.map(p => {
      if (p.sid === participant.sid) {
        return {
          ...p,
          isAudioEnabled: participant.audioTrackPublications.size > 0 && 
                         Array.from(participant.audioTrackPublications.values()).some(pub => pub.isMuted === false),
          isVideoEnabled: participant.videoTrackPublications.size > 0 && 
                         Array.from(participant.videoTrackPublications.values()).some(pub => pub.isMuted === false)
        };
      }
      return p;
    }));
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
      
      const participantWithStatus = {
        ...participant,
        isAudioEnabled: participant.audioTrackPublications.size > 0 && 
                       Array.from(participant.audioTrackPublications.values()).some(pub => pub.isMuted === false),
        isVideoEnabled: participant.videoTrackPublications.size > 0 && 
                       Array.from(participant.videoTrackPublications.values()).some(pub => pub.isMuted === false)
      };
      setParticipants(prev => [...prev, participantWithStatus]);
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

    // 트랙 Mute/Unmute 이벤트 처리
    room.on(RoomEvent.TrackMuted, (publication, participant) => {
      console.log('트랙 음소거됨:', publication.kind, participant.identity);
      updateParticipantStatus(participant);
    });

    room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
      console.log('트랙 음소거 해제됨:', publication.kind, participant.identity);
      updateParticipantStatus(participant);
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
            pendingVideoTrack.attach(videoRef.current);
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
            pendingAudioTrack.attach(audioRef.current);
            console.log('[오디오 연결] pending 오디오 트랙 연결 완료:', participantSid);
            // 오디오 엘리먼트 설정 확인
            if (audioRef.current.muted) {
              audioRef.current.muted = false;
              console.log('[오디오 연결] muted 해제:', participantSid);
            }
            audioRef.current.play().catch(e => console.log('[오디오 연결] 자동재생 실패 (정상):', e));
          }
        }, 500); // 더 긴 지연시간으로 변경
        pendingAudioTracks.current.delete(participantSid);
      }
    }
    return remoteAudioRefs.current.get(participantSid);
  };

  // SSE STT 훅 사용 (실제 방 ID 사용)
  const sttHook = useSSESTT(actualRoomId, participantName, room);
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

    // 자동 연결 제거 - 수동 연결 버튼 방식으로 변경

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
      // 비디오 트랙이 없을 때 비디오 엘리먼트 정리
      localVideoRef.current.srcObject = null;
      console.log('로컬 비디오 트랙 정리됨');
    }
  }, [localVideoTrack]);

  // 표정 분석 정리 (컴포넌트 언마운트시)
  useEffect(() => {
    return () => {
      stopEmotionDetection();
    };
  }, []);

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

  // 미디어 테스트 초기화 및 상태 변경 감지
  useEffect(() => {
    if (showMediaTest) {
      if (!mediaDevices.cameras.length && !mediaDevices.microphones.length) {
        // 디바이스 목록이 없으면 먼저 가져오기
        getMediaDevices().then(() => {
          startTestStream();
        });
      } else {
        // 디바이스 목록이 있으면 바로 스트림 시작
        startTestStream();
      }
    }

    return () => {
      if (showMediaTest) {
        stopTestStream();
      }
    };
  }, [showMediaTest, testVideoEnabled, testAudioEnabled]); // 미디어 상태 변경도 감지

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


  // 게스트로 참가
  const handleGuestJoin = () => {
    if (!guestNickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    setParticipantName(guestNickname);
    setIsGuestMode(true);
    setShowGuestModal(false);
    setShowConnectButton(true); // 연결 버튼 표시
  };

  // 연결 시작 버튼 클릭 - 미디어 테스트 단계로 이동
  const handleStartConnection = () => {
    setShowConnectButton(false);
    setShowMediaTest(true);
  };

  // 미디어 테스트 완료 후 실제 연결
  const handleMediaTestComplete = async () => {
    console.log('=== 테스트 설정 적용 ===', {
      camera: selectedCamera,
      microphone: selectedMicrophone,
      noiseSuppression: noiseSuppressionEnabled,
      videoEnabled: testVideoEnabled,
      audioEnabled: testAudioEnabled,
      cameraDeviceName: mediaDevices.cameras.find(c => c.deviceId === selectedCamera)?.label || 'Unknown',
      microphoneDeviceName: mediaDevices.microphones.find(m => m.deviceId === selectedMicrophone)?.label || 'Unknown'
    });
    
    // 테스트 스트림 정리
    stopTestStream();
    setShowMediaTest(false);
    setCallStartTime(Date.now());
    
    // 상태 업데이트
    setIsCameraOn(testVideoEnabled);
    setIsMicOn(testAudioEnabled);
    setActiveCamera(selectedCamera);
    setActiveMicrophone(selectedMicrophone);
    setActiveNoiseSuppression(noiseSuppressionEnabled);
    
    // 테스트 설정을 직접 전달하여 상태 비동기 문제 해결
    await connectToRoom({
      cameraEnabled: testVideoEnabled,
      micEnabled: testAudioEnabled,
      cameraDeviceId: selectedCamera,
      micDeviceId: selectedMicrophone,
      noiseSuppression: noiseSuppressionEnabled
    });
  };

  // 미디어 디바이스 목록 가져오기
  const getMediaDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      const microphones = devices.filter(device => device.kind === 'audioinput');
      const speakers = devices.filter(device => device.kind === 'audiooutput');
      
      setMediaDevices({ cameras, microphones, speakers });
      
      // 기본 디바이스 선택
      if (cameras.length > 0 && !selectedCamera) {
        setSelectedCamera(cameras[0].deviceId);
      }
      if (microphones.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(microphones[0].deviceId);
      }
    } catch (error) {
      console.error('미디어 디바이스 목록 가져오기 실패:', error);
    }
  };

  // 테스트 스트림 시작
  const startTestStream = async () => {
    try {
      // getUserMedia는 최소 하나의 미디어(audio 또는 video)가 필요
      if (!testVideoEnabled && !testAudioEnabled) {
        console.log('오디오와 비디오가 모두 비활성화되어 스트림을 생성하지 않습니다.');
        return;
      }

      const constraints = {
        video: testVideoEnabled ? {
          deviceId: selectedCamera && selectedCamera !== '' ? { exact: selectedCamera } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false,
        audio: testAudioEnabled ? {
          deviceId: selectedMicrophone && selectedMicrophone !== '' ? { exact: selectedMicrophone } : undefined,
          echoCancellation: true,
          noiseSuppression: noiseSuppressionEnabled
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setTestStream(stream);

      // 비디오 연결
      if (testVideoRef.current && testVideoEnabled) {
        testVideoRef.current.srcObject = stream;
        testVideoRef.current.play().catch(console.error);
      }

      // 오디오 레벨 분석 시작
      if (testAudioEnabled) {
        setupAudioLevelDetection(stream);
      }

    } catch (error) {
      console.error('테스트 스트림 시작 실패:', error);
      setError(`미디어 접근 실패: ${error.message}`);
    }
  };

  // 오디오 레벨 감지 설정
  const setupAudioLevelDetection = (stream) => {
    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      testAudioContextRef.current = audioContext;
      testAnalyserRef.current = analyser;
      
      // 오디오 레벨 모니터링 시작
      const checkAudioLevel = () => {
        if (!testAnalyserRef.current) return;
        
        const bufferLength = testAnalyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        testAnalyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setAudioLevel(Math.round((average / 255) * 100));
        
        requestAnimationFrame(checkAudioLevel);
      };
      
      checkAudioLevel();
    } catch (error) {
      console.error('오디오 레벨 감지 설정 실패:', error);
    }
  };

  // 테스트 스트림 정리
  const stopTestStream = () => {
    if (testStream) {
      testStream.getTracks().forEach(track => track.stop());
      setTestStream(null);
    }
    
    if (testAudioContextRef.current) {
      testAudioContextRef.current.close();
      testAudioContextRef.current = null;
    }
    
    if (testVideoRef.current) {
      testVideoRef.current.srcObject = null;
    }
    
    setAudioLevel(0);
  };

  // 테스트 비디오 토글
  const toggleTestVideo = async () => {
    const newVideoEnabled = !testVideoEnabled;
    setTestVideoEnabled(newVideoEnabled);
    
    // 스트림이 없거나 비어있는 경우 새로 생성 (즉시 실행)
    if (!testStream || (testStream.getTracks().length === 0)) {
      // 새 상태로 즉시 스트림 생성
      if (newVideoEnabled || testAudioEnabled) {
        try {
          const constraints = {
            video: newVideoEnabled ? {
              deviceId: selectedCamera && selectedCamera !== '' ? { exact: selectedCamera } : undefined,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } : false,
            audio: testAudioEnabled ? {
              deviceId: selectedMicrophone && selectedMicrophone !== '' ? { exact: selectedMicrophone } : undefined,
              echoCancellation: true,
              noiseSuppression: noiseSuppressionEnabled
            } : false
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          setTestStream(stream);

          // 비디오 연결
          if (testVideoRef.current && newVideoEnabled) {
            testVideoRef.current.srcObject = stream;
            testVideoRef.current.play().catch(console.error);
          }

          // 오디오 레벨 분석 시작
          if (testAudioEnabled) {
            setupAudioLevelDetection(stream);
          }
        } catch (error) {
          console.error('비디오 토글 중 스트림 생성 실패:', error);
          setError(`미디어 접근 실패: ${error.message}`);
        }
      }
      return;
    }
    
    if (newVideoEnabled) {
      // 비디오를 켜는 경우
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: selectedCamera && selectedCamera !== '' ? { exact: selectedCamera } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        const newVideoTrack = videoStream.getVideoTracks()[0];
        
        // 기존 비디오 트랙이 있다면 제거
        const existingVideoTracks = testStream.getVideoTracks();
        existingVideoTracks.forEach(track => {
          testStream.removeTrack(track);
          track.stop();
        });
        
        // 새 비디오 트랙 추가
        testStream.addTrack(newVideoTrack);
        
        // 비디오 엘리먼트 업데이트
        if (testVideoRef.current) {
          testVideoRef.current.srcObject = testStream;
          testVideoRef.current.play().catch(console.error);
        }
      } catch (error) {
        console.error('비디오 트랙 추가 실패:', error);
        setTestVideoEnabled(false);
      }
    } else {
      // 비디오를 끄는 경우
      const videoTracks = testStream.getVideoTracks();
      videoTracks.forEach(track => {
        testStream.removeTrack(track);
        track.stop();
      });
      
      // 오디오도 없으면 스트림 완전 정리
      if (!testAudioEnabled || testStream.getAudioTracks().length === 0) {
        stopTestStream();
        return;
      }
      
      // 비디오만 꺼진 경우 비디오 엘리먼트 업데이트
      if (testVideoRef.current) {
        testVideoRef.current.srcObject = testStream;
      }
    }
  };

  // 테스트 오디오 토글
  const toggleTestAudio = async () => {
    const newAudioEnabled = !testAudioEnabled;
    setTestAudioEnabled(newAudioEnabled);
    
    // 스트림이 없거나 비어있는 경우 새로 생성 (즉시 실행)
    if (!testStream || (testStream.getTracks().length === 0)) {
      // 새 상태로 즉시 스트림 생성
      if (newAudioEnabled || testVideoEnabled) {
        try {
          const constraints = {
            video: testVideoEnabled ? {
              deviceId: selectedCamera && selectedCamera !== '' ? { exact: selectedCamera } : undefined,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } : false,
            audio: newAudioEnabled ? {
              deviceId: selectedMicrophone && selectedMicrophone !== '' ? { exact: selectedMicrophone } : undefined,
              echoCancellation: true,
              noiseSuppression: noiseSuppressionEnabled
            } : false
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          setTestStream(stream);

          // 비디오 연결
          if (testVideoRef.current && testVideoEnabled) {
            testVideoRef.current.srcObject = stream;
            testVideoRef.current.play().catch(console.error);
          }

          // 오디오 레벨 분석 시작
          if (newAudioEnabled) {
            setupAudioLevelDetection(stream);
          }
        } catch (error) {
          console.error('오디오 토글 중 스트림 생성 실패:', error);
          setError(`미디어 접근 실패: ${error.message}`);
        }
      }
      return;
    }
    
    // 오디오 분석기 정리
    if (testAudioContextRef.current) {
      testAudioContextRef.current.close();
      testAudioContextRef.current = null;
    }
    setAudioLevel(0);
    
    if (newAudioEnabled) {
      // 오디오를 켜는 경우
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: selectedMicrophone && selectedMicrophone !== '' ? { exact: selectedMicrophone } : undefined,
            echoCancellation: true,
            noiseSuppression: noiseSuppressionEnabled
          }
        });
        
        const newAudioTrack = audioStream.getAudioTracks()[0];
        
        // 기존 오디오 트랙이 있다면 제거
        const existingAudioTracks = testStream.getAudioTracks();
        existingAudioTracks.forEach(track => {
          testStream.removeTrack(track);
          track.stop();
        });
        
        // 새 오디오 트랙 추가
        testStream.addTrack(newAudioTrack);
        
        // 오디오 레벨 분석 재시작
        setupAudioLevelDetection(testStream);
      } catch (error) {
        console.error('오디오 트랙 추가 실패:', error);
        setTestAudioEnabled(false);
      }
    } else {
      // 오디오를 끄는 경우
      const audioTracks = testStream.getAudioTracks();
      audioTracks.forEach(track => {
        testStream.removeTrack(track);
        track.stop();
      });
      
      // 비디오도 없으면 스트림 완전 정리
      if (!testVideoEnabled || testStream.getVideoTracks().length === 0) {
        stopTestStream();
        return;
      }
    }
  };

  // 디바이스 변경 - 해당 미디어만 재시작
  const handleDeviceChange = async (type, deviceId) => {
    if (type === 'camera') {
      setSelectedCamera(deviceId);
      
      // 스트림이 있고 비디오가 활성화된 경우에만 변경
      if (testStream && testVideoEnabled && testStream.getTracks().length > 0) {
        // 기존 비디오 트랙 제거
        const videoTracks = testStream.getVideoTracks();
        videoTracks.forEach(track => {
          testStream.removeTrack(track);
          track.stop();
        });
        
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: deviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
          
          const newVideoTrack = videoStream.getVideoTracks()[0];
          testStream.addTrack(newVideoTrack);
          
          if (testVideoRef.current) {
            testVideoRef.current.srcObject = testStream;
            testVideoRef.current.play().catch(console.error);
          }
        } catch (error) {
          console.error('카메라 변경 실패:', error);
        }
      }
    } else if (type === 'microphone') {
      setSelectedMicrophone(deviceId);
      
      // 스트림이 있고 오디오가 활성화된 경우에만 변경
      if (testStream && testAudioEnabled && testStream.getTracks().length > 0) {
        // 오디오 분석기 정리
        if (testAudioContextRef.current) {
          testAudioContextRef.current.close();
          testAudioContextRef.current = null;
        }
        setAudioLevel(0);
        
        // 기존 오디오 트랙 제거
        const audioTracks = testStream.getAudioTracks();
        audioTracks.forEach(track => {
          testStream.removeTrack(track);
          track.stop();
        });
        
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: { exact: deviceId },
              echoCancellation: true,
              noiseSuppression: noiseSuppressionEnabled
            }
          });
          
          const newAudioTrack = audioStream.getAudioTracks()[0];
          testStream.addTrack(newAudioTrack);
          
          // 오디오 레벨 분석 재시작
          setupAudioLevelDetection(testStream);
        } catch (error) {
          console.error('마이크 변경 실패:', error);
        }
      }
    }
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
        setLocalVideoTrack(null); // 트랙 제거
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#FEFCF8] rounded-lg p-6 max-w-md w-full border border-[#5C351A]">
        <h2 className="text-2xl font-bold mb-4 text-[#2A2A2A]">화상채팅 참여</h2>
        <p className="text-[#4A4A4A] mb-6">
          게스트로 참여하거나 로그인하여 참여할 수 있습니다.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="guestNickname" className="block text-sm font-medium text-[#2A2A2A] mb-2">
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
              className="w-full px-3 py-2 border border-[#D6CDB8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C351A]"
              autoFocus
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleGuestJoin}
              className="flex-1 bg-[#5C351A] hover:bg-[#4D280E] text-white py-2 px-4 rounded-lg transition-colors"
            >
              게스트로 참여
            </button>
            <button
              onClick={handleLogin}
              className="flex-1 bg-[#4D280E] hover:bg-[#3E1F0A] text-white py-2 px-4 rounded-lg transition-colors"
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
      <div className="min-h-screen bg-gradient-to-br from-[#F5F2ED] via-[#E8DCC0] to-[#D6CDB8] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">연결 오류</h2>
          <p className="text-[#4A4A4A] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#5C351A] text-white rounded-lg hover:bg-[#4D280E] shadow-lg border border-[#3E1F0A]"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 미디어 테스트 화면
  if (showMediaTest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F2ED] via-[#E8DCC0] to-[#D6CDB8] flex items-center justify-center p-4">
        <div className="bg-[#FEFCF8] rounded-lg shadow-xl max-w-4xl w-full border border-[#5C351A]">
          <div className="p-6 border-b border-[#5C351A]">
            <h2 className="text-2xl font-bold text-[#2A2A2A] mb-2">카메라 및 마이크 테스트</h2>
            <p className="text-[#4A4A4A]">통화를 시작하기 전에 카메라와 마이크가 제대로 작동하는지 확인해주세요.</p>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-6">
            {/* 비디오 프리뷰 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#2A2A2A]">카메라 테스트</h3>
              <div className="relative bg-[#F2EDE2] rounded-lg overflow-hidden border border-[#5C351A] aspect-video">
                {testVideoEnabled ? (
                  <video
                    ref={testVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#4A4A4A]">
                    <div className="text-center">
                      <span className="text-4xl mb-2 block">📷</span>
                      <p>카메라가 꺼져있습니다</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 right-2">
                  <button
                    onClick={toggleTestVideo}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors ${
                      testVideoEnabled ? 'bg-[#5C351A] hover:bg-[#4D280E]' : 'bg-[#D6CDB8] hover:bg-[#CCC2A7]'
                    }`}
                  >
                    {testVideoEnabled ? '📹' : '📷'}
                  </button>
                </div>
              </div>

              {/* 카메라 선택 */}
              {mediaDevices.cameras.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-[#2A2A2A] mb-2">카메라 선택</label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => handleDeviceChange('camera', e.target.value)}
                    className="w-full px-3 py-2 border border-[#D6CDB8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C351A]"
                  >
                    {mediaDevices.cameras.map((camera) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `카메라 ${camera.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 오디오 테스트 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#2A2A2A]">마이크 테스트</h3>
              
              {/* 마이크 레벨 표시 */}
              <div className="p-4 bg-[#F8F5F0] rounded-lg border border-[#5C351A]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[#4A4A4A]">음성 레벨</span>
                  <span className="text-sm text-[#5C351A] font-medium">{audioLevel}%</span>
                </div>
                <div className="w-full bg-[#D6CDB8] rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-150 ${
                      audioLevel > 50 ? 'bg-green-500' :
                      audioLevel > 20 ? 'bg-yellow-500' : 'bg-[#CCC2A7]'
                    }`}
                    style={{ width: `${Math.min(audioLevel, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-[#4A4A4A] mt-1">
                  마이크에 대고 말씀해보세요. 막대가 움직이면 정상입니다.
                </p>
              </div>

              {/* 마이크 토글 */}
              <button
                onClick={toggleTestAudio}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  testAudioEnabled 
                    ? 'bg-[#5C351A] hover:bg-[#4D280E] text-white' 
                    : 'bg-[#D6CDB8] hover:bg-[#CCC2A7] text-[#4A4A4A]'
                }`}
              >
                {testAudioEnabled ? '🎤 마이크 켜짐' : '🔇 마이크 꺼짐'}
              </button>

              {/* 마이크 선택 */}
              {mediaDevices.microphones.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-[#2A2A2A] mb-2">마이크 선택</label>
                  <select
                    value={selectedMicrophone}
                    onChange={(e) => handleDeviceChange('microphone', e.target.value)}
                    className="w-full px-3 py-2 border border-[#D6CDB8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C351A]"
                  >
                    {mediaDevices.microphones.map((mic) => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || `마이크 ${mic.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 소음 억제 설정 */}
              <div className="flex items-center justify-between p-3 bg-[#F8F5F0] rounded-lg border border-[#5C351A]">
                <span className="text-sm text-[#4A4A4A]">소음 억제</span>
                <button
                  onClick={toggleNoiseSuppression}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    noiseSuppressionEnabled ? 'bg-[#5C351A] text-white' : 'bg-[#D6CDB8] text-[#4A4A4A]'
                  }`}
                >
                  {noiseSuppressionEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* 현재 설정 요약 */}
          <div className="px-6 py-4 bg-[#F8F5F0] border-t border-[#5C351A]">
            <h4 className="text-sm font-medium text-[#2A2A2A] mb-2">통화 시작 시 적용될 설정:</h4>
            <div className="flex gap-4 text-sm text-[#4A4A4A]">
              <span className={`flex items-center gap-1 ${testVideoEnabled ? 'text-[#5C351A] font-medium' : ''}`}>
                {testVideoEnabled ? '📹' : '📷'} 카메라: {testVideoEnabled ? 'ON' : 'OFF'}
              </span>
              <span className={`flex items-center gap-1 ${testAudioEnabled ? 'text-[#5C351A] font-medium' : ''}`}>
                {testAudioEnabled ? '🎤' : '🔇'} 마이크: {testAudioEnabled ? 'ON' : 'OFF'}
              </span>
              <span className={`flex items-center gap-1 ${noiseSuppressionEnabled ? 'text-[#5C351A] font-medium' : ''}`}>
                🔧 소음억제: {noiseSuppressionEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="p-6 border-t border-[#5C351A] flex justify-between">
            <button
              onClick={() => {
                stopTestStream();
                setShowMediaTest(false);
                setShowConnectButton(true);
              }}
              className="px-6 py-3 bg-[#D6CDB8] text-[#2A2A2A] rounded-lg hover:bg-[#CCC2A7] transition-colors"
            >
              뒤로 가기
            </button>
            <button
              onClick={() => {
                stopTestStream();
                handleMediaTestComplete();
              }}
              className="px-8 py-3 bg-[#5C351A] text-white font-semibold rounded-lg hover:bg-[#4D280E] transition-colors shadow-lg"
            >
              이 설정으로 통화 시작
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 연결 버튼 표시 조건
  if (showConnectButton && !isConnected && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F2ED] via-[#E8DCC0] to-[#D6CDB8] flex items-center justify-center">
        <div className="bg-[#FEFCF8] p-8 rounded-lg shadow-xl max-w-md w-full mx-4 text-center border border-[#5C351A]">
          <h2 className="text-2xl font-bold text-[#2A2A2A] mb-4">화상 회의 준비</h2>
          <div className="mb-6">
            <p className="text-[#4A4A4A] mb-2">룸: <span className="font-semibold text-[#5C351A]">{roomName}</span></p>
            <p className="text-[#4A4A4A]">
              참가자: <span className="font-semibold text-[#5C351A]">{isGuestMode ? `게스트 ${participantName}` : participantName}</span>
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleStartConnection}
              className="w-full px-6 py-3 bg-[#5C351A] text-white font-semibold rounded-lg hover:bg-[#4D280E] transition-colors shadow-lg border-2 border-[#3E1F0A]"
            >
              🎤📹 미디어 테스트
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-[#D6CDB8] text-[#2A2A2A] rounded-lg hover:bg-[#CCC2A7] transition-colors shadow border border-[#C2B596]"
            >
              나가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F2ED] via-[#E8DCC0] to-[#D6CDB8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#5C351A] mx-auto mb-4"></div>
          <p className="text-[#2A2A2A] text-xl font-medium">연결 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] bg-gradient-to-br from-[#F5F2ED] via-[#E8DCC0] to-[#D6CDB8] flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="bg-[#FEFCF8] shadow-lg p-4 flex-shrink-0 border-b border-[#5C351A]"> 
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-[#2A2A2A] text-xl font-bold">화상 회의</h1>
            <p className="text-sm text-[#4A4A4A]">
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
                  {participant.isVideoEnabled ? '📹' : '📵'}
                  {speakingParticipants.has(participant.sid) && ' 🗣️'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 사이드바 - AI 대화코치 */}
        <ConversationSidebar
          emotionScores={emotionScores}
          conflictLevel={conflictLevel}
          conversations={conversations}
          sttEnabled={sttEnabled}
          aiMediationEnabled={aiMediationEnabled}
          toggleSTT={toggleSTT}
          toggleAIMediation={toggleAIMediation}
          participantName={participantName}
        />
      </div>

      {/* 하단 컨트롤 바 */}
      <div className="bg-[#FEFCF8] shadow-lg p-4 flex-shrink-0 border-t border-[#5C351A]">
        <div className="flex justify-center items-center space-x-4">
          {/* 마이크 토글 */}
          <button
            onClick={toggleMicrophone}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors shadow-lg ${
              isMicOn ? 'bg-[#5C351A] hover:bg-[#4D280E] border-2 border-[#3E1F0A]' : 'bg-[#D6CDB8] hover:bg-[#CCC2A7] border-2 border-[#C2B596]'
            }`}
            title={isMicOn ? '마이크 끄기' : '마이크 켜기'}
          >
            {isMicOn ? '🎤' : '🔇'}
          </button>

          {/* 비디오 토글 */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors shadow-lg ${
              isCameraOn ? 'bg-[#4D280E] hover:bg-[#3E1F0A] border-2 border-[#2A2A2A]' : 'bg-[#D6CDB8] hover:bg-[#CCC2A7] border-2 border-[#C2B596]'
            }`}
            title={isCameraOn ? '비디오 끄기' : '비디오 켜기'}
          >
            {isCameraOn ? '📹' : '📷'}
          </button>

          {/* 소음 억제 토글 */}
          <button
            onClick={toggleNoiseSuppression}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg ${
              noiseSuppressionEnabled
                ? 'bg-[#5C351A] hover:bg-[#4D280E] border-2 border-[#3E1F0A] text-white'
                : 'bg-[#F8F5F0] hover:bg-[#F2EDE2] border-2 border-[#E8DCC0] text-[#5C351A]'
            }`}
            title={noiseSuppressionEnabled ? '소음 제거 ON' : '소음 제거 OFF'}
          >
            {noiseSuppressionEnabled ? '🔇' : '🔊'}
          </button>

          {/* 나가기 버튼 */}
          <button
            onClick={() => handleLeaveRoom(true)}
            className="w-12 h-12 rounded-full bg-[#5C351A] hover:bg-[#4D280E] flex items-center justify-center text-white transition-colors shadow-lg border-2 border-[#3E1F0A]"
          >
            📞
          </button>
        </div>

        {/* 상태 표시 */}
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