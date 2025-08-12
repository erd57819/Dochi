import React from 'react';
import { getKakaoAuthUrl } from '../../config/kakaoConfig.js';
import kakaoLogin from '@/assets/kakao_login.png'
const KakaoLoginButton = () => {
  const handleKakaoLogin = () => {
    window.location.href = getKakaoAuthUrl();
  };

  return (
    <button 
      onClick={handleKakaoLogin}
      className="inline-block hover:opacity-80 transition-all duration-200"
      title="카카오로 로그인"
    >
      <img src={kakaoLogin} alt="카카오 로그인" className="h-12 object-contain" />
    </button>
  );
};

export default KakaoLoginButton;
