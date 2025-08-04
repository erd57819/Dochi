import { API_BASE_URL } from '../config/api';

export const kakaoAuthService = {
  // 카카오 로그인 처리
  loginWithKakao: async (code) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/oauth?code=${code}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '카카오 로그인에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Kakao login error:', error);
      throw error;
    }
  },

  // 카카오 회원 탈퇴
  withdrawKakao: async (code) => {
    try {
      const response = await fetch(`${API_BASE_URL}/oauth/withdraw?code=${code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '카카오 회원 탈퇴에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Kakao withdraw error:', error);
      throw error;
    }
  },
};

export default kakaoAuthService;
