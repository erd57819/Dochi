export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080',
  TIMEOUT: 10000,
};

// API Base URL for direct use
export const API_BASE_URL = 'http://localhost:8080';

// Vite 환경 변수 사용
export const getApiUrl = () => {
  // Vite에서는 import.meta.env 사용
  if (import.meta.env.PROD) {  // production 환경
    return 'http://localhost:8080';
  }
  return 'http://localhost:8080';  // development 환경
};