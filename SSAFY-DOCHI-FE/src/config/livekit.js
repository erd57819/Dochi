// src/config/livekit.js
export const LIVEKIT_CONFIG = {
  // LiveKit 서버 URL - nginx 프록시를 통해 연결
  LIVEKIT_URL: 'wss://i13c209.p.ssafy.io:8090/livekit',
  
  // 백엔드 토큰 발급 엔드포인트
  TOKEN_ENDPOINT: '/dochi/video-call/token',
  
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
  ? (window.location.hostname === 'localhost' 
      ? 'http://localhost:1443'  // 로컬 개발 환경
      : 'https://i13c209.p.ssafy.io:8090')  // 배포 환경
  : 'http://localhost:8080';