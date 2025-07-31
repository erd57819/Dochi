// src/config/livekit.js
export const LIVEKIT_CONFIG = {
  // LiveKit 서버 URL
  LIVEKIT_URL: 'ws://localhost:7880',
  
  // 백엔드 토큰 발급 엔드포인트
  TOKEN_ENDPOINT: '/dochi/openvidu/token',
  
  // 기본 룸 설정
  DEFAULT_ROOM_OPTIONS: {
    videoCaptureDefaults: {
      resolution: {
        width: 640,
        height: 480,
      },
      frameRate: 30,
    },
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  }
};

// API 서버 URL (기존 설정과 통합)
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-api.com' 
  : 'http://localhost:8080';