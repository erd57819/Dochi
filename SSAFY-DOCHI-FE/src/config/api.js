export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',
  TIMEOUT: 10000,
};

// Vite 환경 변수 사용
export const getApiUrl = () => {
  // Vite에서는 import.meta.env 사용
  if (import.meta.env.PROD) {  // production 환경
    return 'https://your-production-domain.com/api';
  }
  return 'http://localhost:8080/api';  // development 환경 - /notice 제거
};