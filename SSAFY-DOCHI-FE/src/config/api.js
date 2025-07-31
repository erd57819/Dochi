export const API_CONFIG = {
  BASE_URL: '/api',
  TIMEOUT: 10000,
};

// API Base URL for direct use
export const API_BASE_URL = '/api';

// Vite 환경 변수 사용
export const getApiUrl = () => {
  // 로컬/배포 환경 모두 /api 경로 사용 (프록시를 통해)
  return '/api';
};