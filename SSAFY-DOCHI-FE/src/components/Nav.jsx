import React from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore';
import img16 from "@/assets/image-16.png";
import gameIcon from "@/assets/game.png";


export const Nav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user, logOut } = useAuthStore();
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    // localStorage에서 토큰 제거
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // 스토어에서 로그아웃
    logOut();
    
    // 홈으로 이동
    navigate('/');
  };

  return (
    <div className="bg-white flex flex-row justify-center w-full border-b border-gray-100 shadow-sm">
      <div className="bg-white w-[1440px] h-[87px] relative">
        {/* 로고 영역 */}
        <Link to="/" className="absolute flex items-center top-[28px] left-[53px] gap-3 hover:opacity-80 transition-opacity">
          <img
            className="w-9 h-[35px] object-cover"
            alt="참견도치 로고"
            src={img16}
          />
          <div className="[font-family:'Pretendard',Helvetica] text-black text-[32px] font-semibold tracking-[0] leading-[35px]">
            참견도치
          </div>
        </Link>

        {/* 메인 네비게이션 */}
        <div className="absolute w-[698px] h-7 top-[32px] left-[389px] flex justify-between items-center">
          <Link 
            to="/conflict-resolution" 
            className={`w-[165px] h-7 [font-family:'Pretendard',Helvetica] font-bold text-[23px] text-center tracking-[0] leading-[27px] transition-all duration-200 ${
              isActive('/conflict-resolution') 
                ? 'text-[#ff6b35] scale-105' 
                : 'text-[#777777] hover:text-[#ff6b35] hover:scale-105'
            }`}
          >
            갈등해결
          </Link>
          
          <Link 
            to="/comfort" 
            className={`w-[165px] h-7 [font-family:'Pretendard',Helvetica] font-bold text-[23px] text-center tracking-[0] leading-[27px] transition-all duration-200 ${
              isActive('/comfort') 
                ? 'text-[#ff6b35] scale-105' 
                : 'text-[#777777] hover:text-[#ff6b35] hover:scale-105'
            }`}
          >
            토닥토닥
          </Link>
          
          <Link 
            to="/community" 
            className={`w-[165px] h-7 [font-family:'Pretendard',Helvetica] font-bold text-[23px] text-center tracking-[0] leading-[27px] transition-all duration-200 ${
              isActive('/community') 
                ? 'text-[#ff6b35] scale-105' 
                : 'text-[#777777] hover:text-[#ff6b35] hover:scale-105'
            }`}
          >
            커뮤니티
          </Link>
          
          <Link 
            to="/notice" 
            className={`w-[165px] h-7 [font-family:'Pretendard',Helvetica] font-bold text-[23px] text-center tracking-[0] leading-[27px] transition-all duration-200 ${
              isActive('/notice') 
                ? 'text-[#ff6b35] scale-105' 
                : 'text-[#777777] hover:text-[#ff6b35] hover:scale-105'
            }`}
          >
            공지사항
          </Link>
        </div>

        {/* 로그인/회원가입/게임/마이페이지 */}
        <div className="absolute top-[32px] right-[50px] flex items-center gap-4 h-7">
          {isLoggedIn ? (
            <>
              <Link 
                to="/mypage" 
                className={`[font-family:'Pretendard',Helvetica] text-[16px] font-semibold tracking-[0] leading-[27px] transition-all duration-200 hover:scale-105 ${
                  location.pathname.startsWith('/mypage') 
                    ? 'text-[#ff6b35]' 
                    : 'text-[#4a4a4a] hover:text-[#ff6b35]'
                }`}
              >
                마이페이지
              </Link>
              <span className="[font-family:'Pretendard',Helvetica] text-[#4a4a4a] text-[16px] font-medium tracking-[0] leading-[27px]">
                <span className="font-semibold text-[#ff6b35]">{user?.nickname || user?.name}</span>도치님
              </span>
              <button
                onClick={handleLogout}
                className="[font-family:'Pretendard',Helvetica] text-white text-[16px] font-semibold tracking-[0] leading-[20px] bg-gray-500 px-3 py-[4px] rounded-full hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="[font-family:'Pretendard',Helvetica] text-[#4a4a4a] text-[18px] font-semibold tracking-[0] leading-[27px] hover:text-[#ff6b35] transition-all duration-200 hover:scale-105"
              >
                로그인
              </Link>
              
              <Link 
                to="/signup" 
                className="[font-family:'Pretendard',Helvetica] text-white text-[16px] font-semibold tracking-[0] leading-[20px] bg-[#ff6b35] px-3 py-[4px] rounded-full hover:bg-[#e55a2b] hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                회원가입
              </Link>
            </>
          )}
          
          <Link 
            to="/game" 
            className="flex items-center justify-center w-[35px] h-[35px] hover:scale-110 transition-all duration-200"
          >
            <img
              className="w-[30px] h-[30px] object-cover"
              alt="게임"
              src={gameIcon}
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Nav;