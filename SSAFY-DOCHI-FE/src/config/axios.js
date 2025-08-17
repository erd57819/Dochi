import axios from 'axios';
import { API_BASE_URL } from './api';
import { handleApiError, showError } from '../utils/errorHandler';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
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
          const expiredAccessToken = localStorage.getItem('accessToken');
          const response = await axios.post(`${API_BASE_URL}/user/reissue`, {}, {
            headers: {
              'Authorization': `Bearer ${expiredAccessToken}`,
              'X-Refresh-Token': refreshToken,
            }
          });
          
          const { accessToken: newAccessToken } = response.data.data;
          
          // 새 토큰 저장
          localStorage.setItem('accessToken', newAccessToken);
          
          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // 리프레시 실패 시 팝업 표시 후 로그아웃 처리
          showError('세션이 만료되었습니다. 다시 로그인해주세요.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // 리프레시 토큰이 없는 경우
        showError('로그인이 필요한 서비스입니다.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    // 다른 모든 오류 - 서버 메시지 기반 처리
    else {
      const errorMessage = handleApiError(error);
      if (errorMessage) {
        showError(errorMessage);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
