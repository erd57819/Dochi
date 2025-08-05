import React, { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import useAuthStore from '../stores/AuthStore';
import apiClient from '../config/axios';

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
  
  // LiveKit 서버 URL - nginx 프록시 통해 연결
  const LIVEKIT_URL = window.location.hostname === 'localhost' 
    ? 'ws://localhost:7880'  // 로컬 개발
    : 'wss://i13c209.p.ssafy.io/livekit';  // 배포 환경 (nginx 프록시)
  // API Base URL을 상대 경로로 사용 (nginx 프록시를 통해 라우팅됨)
  const API_BASE_URL = '';
  
  // 로컬 비디오 ref
  const localVideoRef = useRef(null);
  
  // 원격 참가자별 video/audio ref 관리
  const remoteVideoRefs = useRef(new Map()); // participantId -> videoRef
  const remoteAudioRefs = useRef(new Map()); // participantId -> audioRef
  
  // 대기중인 트랙들 저장 (DOM 준비 전에 도착한 트랙들)
  const pendingVideoTracks = useRef(new Map()); // participantId -> track
  const pendingAudioTracks = useRef(new Map()); // participantId -> track
  
  // 오디오 분석용 refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const remoteAnalysersRef = useRef(new Map()); // 원격 참가자별 분석기 저장

  // 로컬 비디오 트랙 연결을 위한 useEffect - 실제 연결 수행
  useEffect(() => {
    console.log('=== useEffect for localVideoTrack ===', {
      hasVideoRef: !!localVideoRef.current,
      hasVideoTrack: !!localVideoTrack,
      videoTrack: localVideoTrack
    });
    
    const connectVideo = async () => {
      if (localVideoTrack && localVideoTrack.track && localVideoRef.current) {
        console.log('useEffect에서 비디오 연결 실행');
        const mediaTrack = localVideoTrack.track.mediaStreamTrack;
        
        if (mediaTrack) {
          console.log('useEffect: MediaStreamTrack을 비디오 엘리먼트에 연결');
          const stream = new MediaStream([mediaTrack]);
          localVideoRef.current.srcObject = stream;
          
          try {
            await localVideoRef.current.play();
            console.log('useEffect: 비디오 재생 성공!');
          } catch (playError) {
            console.log('useEffect: 비디오 자동재생 제한:', playError);
          }
        } else {
          console.error('useEffect: MediaStreamTrack을 찾을 수 없음');
        }
      } else {
        console.log('useEffect: 조건 불만족', {
          hasVideoTrack: !!localVideoTrack,
          hasTrack: !!(localVideoTrack?.track),
          hasVideoRef: !!localVideoRef.current
        });
      }
    };
    
    connectVideo();
  }, [localVideoTrack]);

  // video ref가 준비되었을 때 다시 연결 시도
  useEffect(() => {
    console.log('=== useEffect for video ref mount ===');
    
    const connectVideoWhenReady = async () => {
      if (localVideoRef.current && localVideoTrack && localVideoTrack.track) {
        console.log('video ref가 준비됨! 지연된 비디오 연결 수행');
        const mediaTrack = localVideoTrack.track.mediaStreamTrack;
        
        if (mediaTrack) {
          console.log('지연 연결: MediaStreamTrack을 비디오 엘리먼트에 연결');
          const stream = new MediaStream([mediaTrack]);
          localVideoRef.current.srcObject = stream;
          
          try {
            await localVideoRef.current.play();
            console.log('지연 연결: 비디오 재생 성공!');
          } catch (playError) {
            console.log('지연 연결: 비디오 자동재생 제한:', playError);
          }
        }
      }
    };

    // 약간의 지연을 주어 DOM이 완전히 마운트되도록 함
    const timer = setTimeout(connectVideoWhenReady, 100);
    
    return () => clearTimeout(timer);
  }, [isConnected]); // isConnected가 true가 되면 video 요소도 렌더링됨

  // 참가자 변경시 대기중인 트랙들 재연결 시도
  useEffect(() => {
    if (!room || !room.remoteParticipants) {
      console.log('=== 참가자 재연결 시도 중단: room 또는 remoteParticipants 없음 ===');
      return;
    }
    
    // size 접근 전 안전성 검사 추가
    let participantsCount = 0;
    try {
      participantsCount = room.remoteParticipants?.size || 0;
    } catch (error) {
      console.warn('remoteParticipants.size 접근 실패:', error);
      return;
    }
    
    console.log('=== 참가자 변경 감지, 트랙 재연결 시도 ===', {
      roomConnected: room.state,
      remoteParticipantsCount: participantsCount
    });
    
    try {
      // 1. 대기중인 트랙들 먼저 처리 (새로 추가된 참가자들)
      participants.forEach((participant) => {
        const participantId = participant.identity;
        
        // 대기중인 비디오 트랙 연결
        const pendingVideoTrack = pendingVideoTracks.current.get(participantId);
        if (pendingVideoTrack) {
          const videoRef = remoteVideoRefs.current.get(participantId);
          if (videoRef?.current && pendingVideoTrack.mediaStreamTrack) {
            console.log('대기중이던 비디오 트랙 연결:', participantId);
            const stream = new MediaStream([pendingVideoTrack.mediaStreamTrack]);
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.log('비디오 자동재생 제한:', e));
            
            // 대기열에서 제거
            pendingVideoTracks.current.delete(participantId);
          }
        }
        
        // 대기중인 오디오 트랙 연결
        const pendingAudioTrack = pendingAudioTracks.current.get(participantId);
        if (pendingAudioTrack) {
          const audioRef = remoteAudioRefs.current.get(participantId);
          if (audioRef?.current && pendingAudioTrack.mediaStreamTrack) {
            console.log('대기중이던 오디오 트랙 연결:', participantId);
            const stream = new MediaStream([pendingAudioTrack.mediaStreamTrack]);
            audioRef.current.srcObject = stream;
            
            // 오디오 레벨 감지 설정
            setupRemoteAudioLevelDetection(pendingAudioTrack, participantId);
            
            // 대기열에서 제거
            pendingAudioTracks.current.delete(participantId);
          }
        }
      });
      
      // 2. 기존 로직: 모든 원격 참가자의 트랙들을 다시 연결 시도
      if (room.remoteParticipants && room.remoteParticipants.forEach) {
        room.remoteParticipants.forEach((participant) => {
          if (!participant) {
            console.warn('참가자가 null/undefined:', participant);
            return;
          }

          const videoTracks = participant.videoTracks;
          if (!(videoTracks instanceof Map)) {
            console.warn('videoTracks가 Map이 아님:', videoTracks);
            return;
          }

          videoTracks.forEach((publication) => {
            const mediaTrack = publication?.track?.mediaStreamTrack;
            if (!mediaTrack) return;

            const videoRef = remoteVideoRefs.current.get(participant.identity);
            if (videoRef?.current && !videoRef.current.srcObject) {
              try {
                console.log('비디오 트랙 재연결:', participant.identity);
                const stream = new MediaStream([mediaTrack]);
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch((e) =>
                    console.warn('비디오 자동재생 제한:', e)
                );
              } catch (e) {
                console.error('비디오 트랙 연결 실패:', e);
              }
            }
          });

          // 오디오 트랙 재연결 - 같은 방식으로 안전성 검사
          const audioTracks = participant.audioTracks;
          if (!(audioTracks instanceof Map)) {
            console.warn('audioTracks가 Map이 아님:', audioTracks);
            return;
          }

          audioTracks.forEach((publication) => {
            const mediaTrack = publication?.track?.mediaStreamTrack;
            if (!mediaTrack) return;

            const audioRef = remoteAudioRefs.current.get(participant.identity);
            if (audioRef?.current && !audioRef.current.srcObject) {
              try {
                console.log('오디오 트랙 재연결:', participant.identity);
                const stream = new MediaStream([mediaTrack]);
                audioRef.current.srcObject = stream;
                
                // 오디오 레벨 감지 설정
                setupRemoteAudioLevelDetection(publication.track, participant.identity);
              } catch (e) {
                console.error('오디오 트랙 연결 실패:', e);
              }
            }
          });
        });
      }

    } catch (error) {
      console.error('참가자 재연결 중 에러:', error);
    }
  }, [participants, room]);

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
      console.log('받은 token:', liverkitToken);  // 👈 여기에 출력
      
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
      const audioTracksSize = participant.audioTracks?.size || 0;
      const videoTracksSize = participant.videoTracks?.size || 0;
      console.log('=== 새 참가자 연결 ===', {
        identity: participant.identity,
        sid: participant.sid,
        audioTracks: audioTracksSize,
        videoTracks: videoTracksSize
      });
      updateParticipants(room);
    });
    
    // 참가자 연결 해제
    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('참가자 연결 해제:', participant.identity);
      updateParticipants(room);
    });
    
    // 트랙 구독
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('=== 트랙 구독 이벤트 ===', {
        trackKind: track.kind,
        participantId: participant.identity,
        track: track,
        mediaStreamTrack: track.mediaStreamTrack
      });
      
      if (track.kind === Track.Kind.Video) {
        // Ref 기반 비디오 연결 - DOM 동기화 문제 해결
        const videoRef = getOrCreateVideoRef(participant.identity);
        
        if (videoRef.current && track.mediaStreamTrack) {
          console.log('원격 비디오 Ref 연결 시작:', participant.identity);
          const stream = new MediaStream([track.mediaStreamTrack]);
          videoRef.current.srcObject = stream;
          
          videoRef.current.play()
            .then(() => console.log('원격 비디오 재생 성공:', participant.identity))
            .catch(e => console.log('원격 비디오 자동재생 제한:', e));
        } else {
          console.log('원격 비디오 Ref 아직 준비 안됨, 대기열에 저장:', participant.identity);
          // DOM이 준비되지 않았으므로 대기열에 저장
          pendingVideoTracks.current.set(participant.identity, track);
        }
        
      } else if (track.kind === Track.Kind.Audio) {
        // Ref 기반 오디오 연결
        const audioRef = getOrCreateAudioRef(participant.identity);
        
        if (audioRef.current && track.mediaStreamTrack) {
          console.log('원격 오디오 Ref 연결:', participant.identity);
          const stream = new MediaStream([track.mediaStreamTrack]);
          audioRef.current.srcObject = stream;
          
          // 원격 참가자 말하고 있는지 감지 설정
          setupRemoteAudioLevelDetection(track, participant.identity);
        } else {
          console.log('원격 오디오 Ref 아직 준비 안됨, 대기열에 저장:', participant.identity);
          // DOM이 준비되지 않았으므로 대기열에 저장
          pendingAudioTracks.current.set(participant.identity, track);
        }
      }
    });
    
    // 트랙 구독 해제
    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log('트랙 구독 해제:', track.kind, participant.identity);
      
      // Ref 기반 정리
      if (track.kind === Track.Kind.Video) {
        const videoRef = remoteVideoRefs.current.get(participant.identity);
        if (videoRef?.current) {
          videoRef.current.srcObject = null;
        }
      } else if (track.kind === Track.Kind.Audio) {
        const audioRef = remoteAudioRefs.current.get(participant.identity);
        if (audioRef?.current) {
          audioRef.current.srcObject = null;
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
      const localAudioTracksSize = room.localParticipant?.audioTracks?.size || 0;
      if (localAudioTracksSize > 0) {
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
      console.log('=== enableLocalMedia 시작 ===');
      
      // 기존 로컬 스트림이 있다면 정리
      if (localVideoRef.current?.srcObject) {
        const existingStream = localVideoRef.current.srcObject;
        existingStream.getTracks().forEach(track => {
          track.stop();
        });
        localVideoRef.current.srcObject = null;
      }
      
      // 카메라 활성화
      const videoTrack = await room.localParticipant.setCameraEnabled(true);
      console.log('카메라 트랙 생성됨:', videoTrack);
      console.log('카메라 트랙 타입:', typeof videoTrack);
      console.log('카메라 트랙 속성들:', Object.keys(videoTrack || {}));
      
      // LiveKit Track의 실제 MediaStreamTrack에 직접 접근
      if (videoTrack && videoTrack.track) {
        console.log('videoTrack.track:', videoTrack.track);
        console.log('videoTrack.track 속성들:', Object.keys(videoTrack.track));
        
        // LiveKit Track의 내부 MediaStreamTrack 찾기
        const mediaTrack = videoTrack.track.mediaStreamTrack;
        console.log('mediaStreamTrack:', mediaTrack);
        console.log('localVideoRef.current 상태:', localVideoRef.current);
        
        if (mediaTrack) {
          if (localVideoRef.current) {
            console.log('MediaStreamTrack을 직접 비디오 엘리먼트에 연결');
            const stream = new MediaStream([mediaTrack]);
            localVideoRef.current.srcObject = stream;
            
            // 비디오 재생 시작
            try {
              await localVideoRef.current.play();
              console.log('비디오 재생 성공!');
            } catch (playError) {
              console.log('비디오 자동재생 제한:', playError);
            }
          } else {
            console.log('video ref가 아직 준비되지 않음. 나중에 연결하도록 state에 저장');
            // video ref가 준비되지 않았으므로 track만 저장하고 useEffect에서 처리
          }
        } else {
          console.error('MediaStreamTrack을 찾을 수 없음');
        }
      }
      
      setLocalVideoTrack(videoTrack);
      
      // 마이크 활성화
      const audioTrack = await room.localParticipant.setMicrophoneEnabled(true);
      setLocalAudioTrack(audioTrack);
      
      // 오디오 레벨 감지 설정
      if (audioTrack) {
        setupAudioLevelDetection(audioTrack);
      }
      
      console.log('=== enableLocalMedia 완료 ===');
      
    } catch (error) {
      console.error('미디어 활성화 실패:', error);
    }
  };

  // 비디오 트랙 연결 헬퍼 함수
  const attachVideoTrack = (videoTrack, videoElement) => {
    console.log('비디오 트랙 연결 시도:', videoTrack);
    console.log('비디오 엘리먼트:', videoElement);
    console.log('videoTrack 속성들:', Object.keys(videoTrack || {}));
    
    if (!videoTrack || !videoElement) {
      console.log('비디오 트랙 또는 엘리먼트가 없음');
      return;
    }

    try {
      // 방법 1: LiveKit의 attach 메서드 사용
      if (typeof videoTrack.attach === 'function') {
        console.log('방법 1: attach 메서드 사용');
        videoTrack.attach(videoElement);
        console.log('attach 성공!');
        return;
      }

      // 방법 2: videoTrack.track을 통한 접근 (이전 로그에서 확인됨)
      if (videoTrack.track) {
        console.log('방법 2: videoTrack.track 탐색 중...');
        console.log('videoTrack.track 속성들:', Object.keys(videoTrack.track));
        
        // track 객체에서 MediaStreamTrack 찾기
        const trackPossibles = [
          videoTrack.track.mediaStreamTrack,
          videoTrack.track._track,
          videoTrack.track.track,
          videoTrack.track
        ];

        for (let i = 0; i < trackPossibles.length; i++) {
          const possibleTrack = trackPossibles[i];
          if (possibleTrack && possibleTrack instanceof MediaStreamTrack) {
            console.log(`방법 2-${i}: track에서 MediaStreamTrack 발견`);
            const stream = new MediaStream([possibleTrack]);
            videoElement.srcObject = stream;
            videoElement.play().catch(e => console.log('자동재생 제한:', e));
            console.log('track 방식 성공!');
            return;
          }
        }

        // track이 LiveKit Track 인스턴스인 경우 attach 시도
        if (typeof videoTrack.track.attach === 'function') {
          console.log('방법 2-attach: track.attach 메서드 사용');
          videoTrack.track.attach(videoElement);
          console.log('track.attach 성공!');
          return;
        }
      }

      // 방법 3: 직접 mediaStreamTrack 접근
      const directTracks = [
        videoTrack.mediaStreamTrack,
        videoTrack._mediaStreamTrack,
        videoTrack._track?.mediaStreamTrack
      ];

      for (let i = 0; i < directTracks.length; i++) {
        const mediaStreamTrack = directTracks[i];
        if (mediaStreamTrack && mediaStreamTrack instanceof MediaStreamTrack) {
          console.log(`방법 3-${i}: 직접 MediaStreamTrack 발견`);
          const stream = new MediaStream([mediaStreamTrack]);
          videoElement.srcObject = stream;
          videoElement.play().catch(e => console.log('자동재생 제한:', e));
          console.log('직접 MediaStream 방식 성공!');
          return;
        }
      }

      // 방법 4: videoTrack이 이미 MediaStreamTrack인 경우
      if (videoTrack instanceof MediaStreamTrack) {
        console.log('방법 4: videoTrack 자체가 MediaStreamTrack');
        const stream = new MediaStream([videoTrack]);
        videoElement.srcObject = stream;
        videoElement.play().catch(e => console.log('자동재생 제한:', e));
        console.log('직접 videoTrack 방식 성공!');
        return;
      }

      console.error('모든 방법 실패. 전체 객체 구조 출력:');
      console.log('videoTrack:', videoTrack);
      console.log('videoTrack.track:', videoTrack.track);
      
      // 마지막 시도: getUserMedia로 새 스트림 생성
      console.log('마지막 시도: 직접 getUserMedia 사용');
      navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: false 
      }).then(stream => {
        videoElement.srcObject = stream;
        videoElement.play().catch(e => console.log('자동재생 제한:', e));
        console.log('직접 getUserMedia 성공!');
      }).catch(err => {
        console.error('getUserMedia도 실패:', err);
      });

    } catch (error) {
      console.error('비디오 트랙 연결 중 오류:', error);
    }
  };

  // 참가자별 ref 생성/삭제 관리
  const getOrCreateVideoRef = (participantId) => {
    if (!remoteVideoRefs.current.has(participantId)) {
      remoteVideoRefs.current.set(participantId, React.createRef());
    }
    return remoteVideoRefs.current.get(participantId);
  };

  const getOrCreateAudioRef = (participantId) => {
    if (!remoteAudioRefs.current.has(participantId)) {
      remoteAudioRefs.current.set(participantId, React.createRef());
    }
    return remoteAudioRefs.current.get(participantId);
  };

  const cleanupParticipantRefs = (participantId) => {
    remoteVideoRefs.current.delete(participantId);
    remoteAudioRefs.current.delete(participantId);
    remoteAnalysersRef.current.delete(participantId);
    
    // 대기중인 트랙들도 정리
    pendingVideoTracks.current.delete(participantId);
    pendingAudioTracks.current.delete(participantId);
  };

  // 참가자 목록 업데이트
  const updateParticipants = (room) => {
    const remoteParticipants = Array.from(room.remoteParticipants.values());
    
    // 기존 참가자들 중 현재 없는 참가자의 ref 정리
    const currentParticipantIds = new Set(remoteParticipants.map(p => p.identity));
    for (const [participantId] of remoteVideoRefs.current) {
      if (!currentParticipantIds.has(participantId)) {
        cleanupParticipantRefs(participantId);
      }
    }
    
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
            // LiveKit의 최신 방식: track.attach() 사용
            if (videoTrack.attach) {
              videoTrack.attach(localVideoRef.current);
              console.log('카메라 토글: attach 방식으로 연결');
            } else {
              // 대체 방법
              const mediaStreamTrack = videoTrack.mediaStreamTrack || 
                                     videoTrack.track?.mediaStreamTrack;
              if (mediaStreamTrack) {
                const stream = new MediaStream([mediaStreamTrack]);
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.play().catch(e => console.log('비디오 자동재생 제한:', e));
                console.log('카메라 토글: MediaStream 방식으로 연결');
              }
            }
          } else {
            // 카메라 끄기
            if (localVideoRef.current.srcObject) {
              localVideoRef.current.srcObject = null;
            }
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
                        ref={getOrCreateVideoRef(participant.identity)}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <audio
                        ref={getOrCreateAudioRef(participant.identity)}
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