import React from 'react';
import { getKakaoAuthUrl } from '../../config/kakaoConfig';

const KakaoLoginButton = () => {
  const handleKakaoLogin = () => {
    window.location.href = getKakaoAuthUrl();
  };

  return (
    <button 
      onClick={handleKakaoLogin}
      className="flex items-center justify-center p-3 bg-[#FEE500] text-[#000000] rounded-lg hover:bg-[#F7DC00] transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
      title="카카오로 로그인"
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 20 20" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M10 1C4.477 1 0 4.484 0 8.597c0 2.524 1.689 4.759 4.27 6.104l-.857 3.116c-.046.167.104.308.258.237l3.816-1.806A10.836 10.836 0 0010 16.5c5.523 0 10-3.484 10-7.597C20 4.79 15.523 1 10 1" 
          fill="#000000"
        />
      </svg>
    </button>
  );
};

export default KakaoLoginButton;
