import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/AuthStore.js';
import kakaoAuthService from '../../services/kakaoAuthService.js';
import { getKakaoWithdrawUrl } from '../../config/kakaoConfig.js';

const KakaoWithdrawButton = () => {
  const navigate = useNavigate();
  const { user, logOut } = useAuthStore();

  const handleKakaoWithdraw = async () => {
    const confirmWithdraw = window.confirm('정말로 카카오 계정 연동을 해제하고 탈퇴하시겠습니까?');
    
    if (!confirmWithdraw) {
      return;
    }

    // 카카오 연동 해제 페이지로 리다이렉트
    window.location.href = getKakaoWithdrawUrl();
  };

  return (
    <button
      onClick={handleKakaoWithdraw}
      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
    >
      카카오 계정 탈퇴
    </button>
  );
};

export default KakaoWithdrawButton;
