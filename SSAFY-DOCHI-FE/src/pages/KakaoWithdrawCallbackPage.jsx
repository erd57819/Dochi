import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../stores/AuthStore';
import kakaoAuthService from '../../services/kakaoAuthService';

const KakaoWithdrawCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logOut } = useAuthStore();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleKakaoWithdrawCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      // 카카오에서 에러 발생 시 처리
      if (error) {
        setError(errorDescription || '카카오 계정 탈퇴를 취소했습니다.');
        setTimeout(() => navigate('/mypage'), 2000);
        return;
      }
      
      if (!code) {
        setError('카카오 인증 코드를 받을 수 없습니다.');
        setTimeout(() => navigate('/mypage'), 2000);
        return;
      }

      try {
        // 백엔드로 코드를 전송하여 탈퇴 처리
        await kakaoAuthService.withdrawKakao(code);
        
        // 로컬 스토리지 정리
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // 로그아웃 처리
        logOut();
        
        alert('카카오 계정 탈퇴가 완료되었습니다.');
        navigate('/');
      } catch (error) {
        console.error('Kakao withdraw error:', error);
        setError(error.message || '카카오 계정 탈퇴 처리 중 오류가 발생했습니다.');
        setTimeout(() => navigate('/mypage'), 3000);
      }
    };

    handleKakaoWithdrawCallback();
  }, [searchParams, navigate, logOut]);

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
            <p className="text-sm text-gray-500">잠시 후 마이페이지로 이동합니다...</p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4 animate-pulse">
              <span className="text-2xl">👋</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">카카오 계정 탈퇴 처리 중...</h2>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
            <div className="mt-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KakaoWithdrawCallbackPage;
