import React, { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import useAuthStore from '../../stores/AuthStore';
import apiClient from '../../config/axios';
import * as faceapi from 'face-api.js';
import VideoGrid from './VideoGrid';
import ControlBar from './ControlBar';
import ConversationPanel from './ConversationPanel';
import EmotionPanel from './EmotionPanel';

const VideoCallRoom = () => {
  const { token, isLoggedIn } = useAuthStore();
  
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestNickname, setGuestNickname] = useState('');
  const [showGuestModal, setShowGuestModal] = useState(false);
  
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
  
  const [sttEnabled, setSttEnabled] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentSpeech, setCurrentSpeech] = useState({ speaker: null, text: '' });
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const [emotionScores, setEmotionScores] = useState({});
  const [conflictLevel, setConflictLevel] = useState(0);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [isEmotionDetectionActive, setIsEmotionDetectionActive] = useState(false);
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  const getRoomIdFromUrl = () => {
    const pathSegments = window.location.pathname.split('/');
    return pathSegments[pathSegments.length - 1] || 'test-room';
  };
  
  const roomName = getRoomIdFromUrl();
  const [participantName, setParticipantName] = useState('사용자1');
  
  const LIVEKIT_URL = window.location.hostname === 'localhost' 
    ? 'ws://localhost:7880'
    : 'wss://i13c209.p.ssafy.io/livekit';
  const API_BASE_URL = '';
  
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  const remoteAudioRefs = useRef(new Map());
  const pendingVideoTracks = useRef(new Map());
  const pendingAudioTracks = useRef(new Map());
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const remoteAnalysersRef = useRef(new Map());
  
  const recognitionRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const conversationLogRef = useRef([]);
  
  const faceApiModelsLoaded = useRef(false);
  const emotionDetectionInterval = useRef(null);

  // LiveKit 방 연결 함수
  const connectToRoom = async () => {
    try {
      setError(null);
      setIsLoading(true);

      let accessToken;
      const identity = isGuestMode ? guestNickname : (isLoggedIn ? participantName : 'guest');
      
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
    });

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('트랙 구독됨:', track.kind, participant.identity);
      
      if (track.kind === Track.Kind.Video) {
        const videoRef = remoteVideoRefs.current.get(participant.sid);
        if (videoRef) {
          track.attach(videoRef);
        } else {
          pendingVideoTracks.current.set(participant.sid, track);
        }
      } else if (track.kind === Track.Kind.Audio) {
        const audioRef = remoteAudioRefs.current.get(participant.sid);
        if (audioRef) {
          track.attach(audioRef);
        } else {
          pendingAudioTracks.current.set(participant.sid, track);
        }
      }
    });

    room.on(RoomEvent.Disconnected, () => {
      console.log('방에서 연결 해제됨');
      setIsConnected(false);
      setRoom(null);
    });
  };

  // 컨트롤 함수들
  const toggleVideo = async () => {
    if (room) {
      if (isCameraOn) {
        await room.localParticipant.setCameraEnabled(false);
      } else {
        await room.localParticipant.setCameraEnabled(true);
      }
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMicrophone = async () => {
    if (room) {
      const audioOptions = noiseSuppressionEnabled ? {
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true
      } : {};

      if (isMicOn) {
        await room.localParticipant.setMicrophoneEnabled(false);
      } else {
        await room.localParticipant.setMicrophoneEnabled(true, audioOptions);
      }
      setIsMicOn(!isMicOn);
    }
  };

  const toggleNoiseSuppression = () => {
    setNoiseSuppressionEnabled(!noiseSuppressionEnabled);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const leaveRoom = async () => {
    if (room) {
      await room.disconnect();
      window.location.href = '/';
    }
  };

  const toggleSTT = () => {
    setSttEnabled(!sttEnabled);
  };

  const toggleEmotionDetection = () => {
    setIsEmotionDetectionActive(!isEmotionDetectionActive);
  };

  // 게스트 모드 핸들러
  const handleGuestJoin = () => {
    if (!guestNickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }
    setIsGuestMode(true);
    setShowGuestModal(false);
    connectToRoom();
  };

  // 초기화
  useEffect(() => {
    if (!isLoggedIn && !isGuestMode) {
      setShowGuestModal(true);
    } else if (isLoggedIn) {
      connectToRoom();
    }

    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [isLoggedIn, isGuestMode]);

  // 로컬 비디오 연결
  useEffect(() => {
    if (localVideoTrack && localVideoTrack.track && localVideoRef.current) {
      const mediaTrack = localVideoTrack.track.mediaStreamTrack;
      const stream = new MediaStream([mediaTrack]);
      localVideoRef.current.srcObject = stream;
    }
  }, [localVideoTrack]);

  // 게스트 모달
  if (showGuestModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h2 className="text-xl font-bold mb-4">게스트로 참여</h2>
          <p className="text-gray-600 mb-4">화상통화에 참여하기 위해 닉네임을 입력해주세요.</p>
          <input
            type="text"
            placeholder="닉네임을 입력하세요"
            value={guestNickname}
            onChange={(e) => setGuestNickname(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleGuestJoin();
              }
            }}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleGuestJoin}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              참여하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">연결 오류</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-2">
              <button
                onClick={connectToRoom}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                홈으로
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 메인 화상통화 UI
  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* 헤더 */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">화상통화 - {roomName}</h1>
        <div className="text-sm text-gray-300">
          참가자: {participants.length + 1}명
          {isLoading && ' (연결 중...)'}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex">
        {/* 비디오 그리드 */}
        <VideoGrid
          localVideoRef={localVideoRef}
          remoteParticipants={participants}
          isVideoEnabled={isCameraOn}
          isLoading={isLoading}
        />

        {/* 대화 패널 */}
        <ConversationPanel
          conversation={conversations}
          isSTTActive={sttEnabled}
          currentTranscript={currentTranscript}
          toggleSTT={toggleSTT}
        />

        {/* 감정 분석 패널 */}
        <EmotionPanel
          isEmotionDetectionActive={isEmotionDetectionActive}
          currentEmotion={currentEmotion}
          emotionHistory={emotionHistory}
          toggleEmotionDetection={toggleEmotionDetection}
        />
      </div>

      {/* 컨트롤 바 */}
      <ControlBar
        isVideoEnabled={isCameraOn}
        isAudioEnabled={isMicOn}
        noiseSuppressionEnabled={noiseSuppressionEnabled}
        isRecording={isRecording}
        toggleVideo={toggleVideo}
        toggleMicrophone={toggleMicrophone}
        toggleNoiseSuppression={toggleNoiseSuppression}
        toggleRecording={toggleRecording}
        leaveRoom={leaveRoom}
      />
    </div>
  );
};

export default VideoCallRoom;