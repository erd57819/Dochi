import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore.js';
import kakaoAuthService from '../services/kakaoAuthService.js';

const KakaoCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logIn } = useAuthStore();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleKakaoCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      // 카카오에서 에러 발생 시 처리
      if (error) {
        setError(errorDescription || '카카오 로그인을 취소했습니다.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      console.log('받은 카카오 코드:', code);
      console.log('API 요청 URL:', `${process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : ''}/oauth?code=${code}`);
      
      if (!code) {
        setError('카카오 인증 코드를 받을 수 없습니다.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        // 백엔드로 코드를 전송하여 로그인 처리
        const result = await kakaoAuthService.loginWithKakao(code);
        console.log('Kakao login response:', result); // 디버깅용 로그
        
        // ApiResponse 구조에 맞게 접근
        const loginData = result.data || result.response?.response || result.response || result;
        const { accessToken, refreshToken, profileImage, name, nickname, social: isSocial, email, userId } = loginData;
        
        // JWT 토큰을 localStorage에 저장
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // 유저 정보를 스토어에 저장
        logIn({ 
          userId: userId, 
          name: name,
          nickname: nickname,
          email: email,
          profileImage: profileImage,
          isSocial: isSocial
        });
        
        alert('카카오 로그인 성공!');
        navigate('/');
      } catch (error) {
        console.error('Kakao login error:', error);
        setError(error.message || '카카오 로그인 처리 중 오류가 발생했습니다.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleKakaoCallback();
  }, [searchParams, navigate, logIn]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm w-full">
        {error ? (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">오류가 발생했습니다</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">잠시 후 로그인 페이지로 이동합니다...</p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4 animate-pulse">
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 20 20" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  fillRule="evenodd" 
                  clipRule="evenodd" 
                  d="M10 1C4.477 1 0 4.484 0 8.597c0 2.524 1.689 4.759 4.27 6.104l-.857 3.116c-.046.167.104.308.258.237l3.816-1.806A10.836 10.836 0 0010 16.5c5.523 0 10-3.484 10-7.597C20 4.79 15.523 1 10 1" 
                  fill="#3C1E1E"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">카카오 로그인 처리 중...</h2>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
            <div className="mt-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KakaoCallbackPage;
