import axios from 'axios';
import { API_BASE_URL } from './api';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // 토큰 가져오기
    const accessToken = localStorage.getItem('accessToken');
    
    // 토큰이 있으면 헤더에 추가
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 401 에러이고 리프레시 토큰이 있는 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // 리프레시 토큰으로 액세스 토큰 재발급
          const response = await axios.post(`${API_BASE_URL}/user/refresh`, {
            refreshToken: refreshToken,
          });
          
          const { accessToken: newAccessToken } = response.data.data;
          
          // 새 토큰 저장
          localStorage.setItem('accessToken', newAccessToken);
          
          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // 리프레시 실패 시 로그아웃 처리
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
