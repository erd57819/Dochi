import { useState, useRef, useEffect } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import useAuthStore from '../stores/AuthStore';
import apiClient from '../config/axios';

export const useOpenVidu = (roomName, participantName, isGuestMode) => {
  const { token, isLoggedIn } = useAuthStore();

  // 상태 관리
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [error, setError] = useState(null);

  // 말하고 있는 참가자 추적
  const [speakingParticipants, setSpeakingParticipants] = useState(new Set());
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [lastSpeaker, setLastSpeaker] = useState(null);

  // 컨트롤 상태
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [noiseSuppressionEnabled, setNoiseSuppressionEnabled] = useState(true);

  // 참조
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  const remoteAudioRefs = useRef(new Map());
  const pendingVideoTracks = useRef(new Map());
  const pendingAudioTracks = useRef(new Map());

  // 오디오 분석 관련
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const remoteAnalysersRef = useRef(new Map());
  const animationFrameRef = useRef(null);

  // LiveKit 서버 URL
  const LIVEKIT_URL = window.location.hostname === 'localhost'
    ? 'ws://192.168.100.63:7880'
    : 'wss://i13c209.p.ssafy.io/livekit';

  // 토큰 서버에서 가져오기
  const getTokenFromServer = async (roomName) => {
    try {
      console.log('토큰 요청 시작...', { roomName, hasToken: !!token, isGuest: isGuestMode });

      if (isGuestMode) {
        const guestData = {
          room: roomName,
          identity: `guest_${Date.now()}`,
          name: participantName || `게스트_${Date.now()}`
        };

        console.log('게스트 토큰 요청 데이터:', guestData);

        try {
          const guestResponse = await apiClient.post('/video-call/guest-token', guestData, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          console.log('게스트 토큰 응답:', guestResponse.data);

          if (guestResponse.data && guestResponse.data.token) {
            return guestResponse.data.token;
          } else {
            throw new Error('게스트 토큰이 응답에 없습니다');
          }
        } catch (guestError) {
          console.error('게스트 토큰 요청 실패:', guestError);
          throw new Error(`게스트 토큰 요청 실패: ${guestError.message}`);
        }
      }

      const response = await apiClient.post(`/video-call/token?room=${encodeURIComponent(roomName)}`);
      console.log('토큰 응답 데이터:', response.data);

      // 백엔드 응답 구조에 맞춰 수정
      if (response.data.status === 200 && response.data.data) {
        // VideoCallRoomCreateResDto에서 token 가져오기
        return response.data.data.token;
      } else if (response.data.data && response.data.data.token) {
        // 대체 응답 구조
        return response.data.data.token;
      } else {  
        throw new Error('토큰 발급 실패: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('토큰 요청 실패:', error);
      if (error.response) {
        console.error('에러 응답:', error.response.data);
        if (error.response.status === 401) {
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        }
        throw new Error(`서버 에러: ${error.response.data?.message || error.message}`);
      }
      throw new Error(`네트워크 에러: ${error.message}`);
    }
  };

  // 룸 참가
  const joinRoom = async () => {
    try {
      console.log('=== joinRoom 시작 ===');
      setError(null);

      if (room) {
        console.log('이미 룸에 연결되어 있습니다');
        return;
      }

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: {
            width: 1280,
            height: 720,
            frameRate: 15,
          },
        },
      });

      const liverkitToken = await getTokenFromServer(roomName);
      console.log('받은 token:', liverkitToken);

      setupRoomEvents(newRoom);
      
      await newRoom.connect(LIVEKIT_URL, liverkitToken);
      console.log('룸 연결 성공');

      setRoom(newRoom);
      setIsConnected(true);

      await enableLocalMedia(newRoom);
      updateParticipants(newRoom);

    } catch (error) {
      console.error('룸 참가 실패:', error);
      setError(`룸 참가 실패: ${error.message}`);
    }
  };

  // 룸 이벤트 설정
  const setupRoomEvents = (room) => {
    room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log('참가자 연결:', participant.identity);
      updateParticipants(room);
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('참가자 해제:', participant.identity);
      updateParticipants(room);

      const videoRef = remoteVideoRefs.current.get(participant.sid);
      if (videoRef?.current) {
        videoRef.current.srcObject = null;
      }

      const audioRef = remoteAudioRefs.current.get(participant.sid);
      if (audioRef?.current) {
        audioRef.current.srcObject = null;
      }

      remoteVideoRefs.current.delete(participant.sid);
      remoteAudioRefs.current.delete(participant.sid);
      pendingVideoTracks.current.delete(participant.sid);
      pendingAudioTracks.current.delete(participant.sid);

      const analyser = remoteAnalysersRef.current.get(participant.sid);
      if (analyser) {
        analyser.audioContext.close();
        remoteAnalysersRef.current.delete(participant.sid);
      }
    });

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('트랙 구독:', track.kind, participant.identity);
      attachTrack(track, participant);
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log('트랙 구독 해제:', track.kind, participant.identity);
      if (track.kind === Track.Kind.Video) {
        const videoRef = remoteVideoRefs.current.get(participant.sid);
        if (videoRef?.current) {
          videoRef.current.srcObject = null;
        }
      } else if (track.kind === Track.Kind.Audio) {
        const audioRef = remoteAudioRefs.current.get(participant.sid);
        if (audioRef?.current) {
          audioRef.current.srcObject = null;
        }
      }
    });

    room.on(RoomEvent.LocalTrackPublished, (publication) => {
      console.log('로컬 트랙 발행:', publication.kind);
    });

    room.on(RoomEvent.Disconnected, (reason) => {
      console.log('룸 연결 해제:', reason);
      setIsConnected(false);
      setRoom(null);
      setParticipants([]);
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
    });

    room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      console.log('연결 품질 변경:', quality, participant?.identity);
    });
  };

  // 트랙 연결
  const attachTrack = (track, participant) => {
    const element = track.attach();

    if (track.kind === Track.Kind.Video) {
      const videoRef = remoteVideoRefs.current.get(participant.sid);
      if (videoRef?.current) {
        videoRef.current.srcObject = element.srcObject;
        videoRef.current.play().catch(console.error);
      } else {
        pendingVideoTracks.current.set(participant.sid, element.srcObject);
      }
    } else if (track.kind === Track.Kind.Audio) {
      const audioRef = remoteAudioRefs.current.get(participant.sid);
      if (audioRef?.current) {
        audioRef.current.srcObject = element.srcObject;
        audioRef.current.play().catch(console.error);
        setupRemoteAudioAnalyser(element.srcObject, participant.sid);
      } else {
        pendingAudioTracks.current.set(participant.sid, element.srcObject);
      }
    }
  };

  // 원격 오디오 분석기 설정
  const setupRemoteAudioAnalyser = async (stream, participantId) => {
    try {
      if (remoteAnalysersRef.current.has(participantId)) {
        return;
      }

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      source.connect(analyser);

      remoteAnalysersRef.current.set(participantId, { audioContext, analyser });
      
      console.log(`원격 오디오 분석기 설정 완료: ${participantId}`);
    } catch (error) {
      console.error(`원격 오디오 분석기 설정 실패: ${participantId}`, error);
    }
  };

  // 로컬 미디어 활성화
  const enableLocalMedia = async (room) => {
    try {
      console.log('=== enableLocalMedia 시작 ===');
      
      const mediaConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 15 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: noiseSuppressionEnabled,
          autoGainControl: true,
          sampleRate: 48000
        }
      };

      console.log('미디어 제약 조건:', mediaConstraints);

      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      console.log('로컬 미디어 스트림 획득 성공');

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        await localVideoRef.current.play();
      }

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (videoTrack && room) {
        const publication = await room.localParticipant.publishTrack(videoTrack, {
          videoQuality: 'high',
          degradationPreference: 'balanced'
        });
        setLocalVideoTrack(publication.track);
        console.log('비디오 트랙 발행 완료');
      }

      if (audioTrack && room) {
        const publication = await room.localParticipant.publishTrack(audioTrack, {
          dtx: false,
          red: true
        });
        setLocalAudioTrack(publication.track);
        console.log('오디오 트랙 발행 완료');

        await setupLocalAudioAnalyser(stream);
      }

    } catch (error) {
      console.error('로컬 미디어 활성화 실패:', error);
      setError(`미디어 접근 실패: ${error.message}`);
    }
  };

  // 로컬 오디오 분석기 설정
  const setupLocalAudioAnalyser = async (stream) => {
    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      startAudioLevelMonitoring();
      console.log('로컬 오디오 분석기 설정 완료');
    } catch (error) {
      console.error('로컬 오디오 분석기 설정 실패:', error);
    }
  };

  // 오디오 레벨 모니터링 시작
  const startAudioLevelMonitoring = () => {
    const checkAudioLevel = () => {
      if (!analyserRef.current) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;

      const isSpeaking = average > 10;
      setIsLocalSpeaking(isSpeaking);

      remoteAnalysersRef.current.forEach(({ analyser }, participantId) => {
        const remoteDataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(remoteDataArray);

        let remoteSum = 0;
        for (let i = 0; i < remoteDataArray.length; i++) {
          remoteSum += remoteDataArray[i];
        }
        const remoteAverage = remoteSum / remoteDataArray.length;
        const isRemoteSpeaking = remoteAverage > 10;

        setSpeakingParticipants(prev => {
          const newSet = new Set(prev);
          if (isRemoteSpeaking) {
            newSet.add(participantId);
          } else {
            newSet.delete(participantId);
          }
          return newSet;
        });
      });

      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  };

  // 참가자 목록 업데이트
  const updateParticipants = (room) => {
    const remoteParticipants = Array.from(room.remoteParticipants.values());
    
    const participantData = remoteParticipants.map(participant => ({
      sid: participant.sid,
      identity: participant.identity,
      name: participant.name || participant.identity,
      isVideoEnabled: participant.isCameraEnabled,
      isAudioEnabled: participant.isMicrophoneEnabled,
    }));

    setParticipants(participantData);
  };

  // 마이크 토글
  const toggleMicrophone = async () => {
    if (room && localAudioTrack) {
      try {
        const wasEnabled = localAudioTrack.isMuted === false;
        
        if (wasEnabled) {
          localAudioTrack.mute();
        } else {
          localAudioTrack.unmute();
        }
        
        setIsMicOn(!wasEnabled);
      } catch (error) {
        console.error('마이크 토글 실패:', error);
      }
    }
  };

  // 카메라 토글
  const toggleVideo = async () => {
    if (room) {
      try {
        const currentEnabled = isCameraOn;
        
        if (currentEnabled) {
          if (localVideoTrack) {
            localVideoTrack.mute();
          }
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
          }
        } else {
          if (localVideoTrack) {
            localVideoTrack.unmute();
          } else {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  frameRate: { ideal: 15 }
                }
              });
              
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.muted = true;
                await localVideoRef.current.play();
              }

              const videoTrack = stream.getVideoTracks()[0];
              if (videoTrack) {
                const publication = await room.localParticipant.publishTrack(videoTrack);
                setLocalVideoTrack(publication.track);
              }
            } catch (error) {
              console.error('비디오 재활성화 실패:', error);
              return;
            }
          }
          
          if (localVideoRef.current && !localVideoRef.current.srcObject) {
            if (localVideoTrack) {
              const stream = new MediaStream([localVideoTrack.mediaStreamTrack]);
              localVideoRef.current.srcObject = stream;
              await localVideoRef.current.play();
            }
          }
        }
        
        setIsCameraOn(!currentEnabled);
      } catch (error) {
        console.error('카메라 토글 실패:', error);
      }
    }
  };

  // 룸 나가기
  const leaveRoom = async (onFinalEmotionSend) => {
    // 통화 종료 전 남은 표정 데이터 전송
    if (onFinalEmotionSend) {
      await onFinalEmotionSend();
    }

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

    // 원격 참가자 video/audio ref 정리
    remoteVideoRefs.current.forEach((videoRef) => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    });
    remoteAudioRefs.current.forEach((audioRef) => {
      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
    });
    remoteVideoRefs.current.clear();
    remoteAudioRefs.current.clear();

    // 대기중인 트랙들도 정리
    pendingVideoTracks.current.clear();
    pendingAudioTracks.current.clear();

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

  // 소음 억제 토글
  const toggleNoiseSuppression = () => {
    setNoiseSuppressionEnabled(!noiseSuppressionEnabled);
  };

  return {
    // 상태
    room,
    isConnected,
    participants,
    localVideoTrack,
    localAudioTrack,
    error,
    speakingParticipants,
    isLocalSpeaking,
    lastSpeaker,
    isMicOn,
    isCameraOn,
    noiseSuppressionEnabled,

    // 참조
    localVideoRef,
    remoteVideoRefs,
    remoteAudioRefs,
    pendingVideoTracks,
    pendingAudioTracks,

    // 함수
    joinRoom,
    leaveRoom,
    toggleMicrophone,
    toggleVideo,
    toggleNoiseSuppression,
    updateParticipants,
    attachTrack
  };
};