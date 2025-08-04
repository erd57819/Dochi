import React, { useState } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore';
import img16 from "@/assets/image-16.png";
import gameIcon from "@/assets/game.png";


export const Nav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user, logOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <nav className="bg-white w-full border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* 로고 영역 */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img
              className="w-8 h-8 lg:w-9 lg:h-9 object-cover"
              alt="참견도치 로고"
              src={img16}
            />
            <div className="font-semibold text-xl lg:text-2xl text-black">
              참견도치
            </div>
          </Link>

          {/* 데스크톱 메인 네비게이션 */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link 
              to="/conflicts"
              className={`font-bold text-lg transition-all duration-200 hover:scale-105 ${
                isActive('/conflicts') 
                  ? 'text-[#ff6b35] scale-105' 
                  : 'text-[#777777] hover:text-[#ff6b35]'
              }`}
            >
              갈등해결
            </Link>
            
            <Link 
              to="/comfort" 
              className={`font-bold text-lg transition-all duration-200 hover:scale-105 ${
                isActive('/comfort') 
                  ? 'text-[#ff6b35] scale-105' 
                  : 'text-[#777777] hover:text-[#ff6b35]'
              }`}
            >
              토닥토닥
            </Link>
            
            <Link 
              to="/community" 
              className={`font-bold text-lg transition-all duration-200 hover:scale-105 ${
                isActive('/community') 
                  ? 'text-[#ff6b35] scale-105' 
                  : 'text-[#777777] hover:text-[#ff6b35]'
              }`}
            >
              커뮤니티
            </Link>
            
            <Link 
              to="/notice" 
              className={`font-bold text-lg transition-all duration-200 hover:scale-105 ${
                isActive('/notice') 
                  ? 'text-[#ff6b35] scale-105' 
                  : 'text-[#777777] hover:text-[#ff6b35]'
              }`}
            >
              공지사항
            </Link>
          </div>

          {/* 데스크톱 사용자 메뉴 */}
          <div className="hidden lg:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Link 
                  to="/mypage" 
                  className={`text-sm font-semibold transition-all duration-200 hover:scale-105 ${
                    location.pathname.startsWith('/mypage') 
                      ? 'text-[#ff6b35]' 
                      : 'text-[#4a4a4a] hover:text-[#ff6b35]'
                  }`}
                >
                  마이페이지
                </Link>
                <span className="text-[#4a4a4a] text-sm font-medium">
                  <span className="font-semibold text-[#ff6b35]">{user?.nickname || user?.name}</span>도치님
                </span>
                <button
                  onClick={handleLogout}
                  className="text-white text-sm font-semibold bg-gray-500 px-3 py-2 rounded-full hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-[#4a4a4a] text-base font-semibold hover:text-[#ff6b35] transition-all duration-200 hover:scale-105"
                >
                  로그인
                </Link>
                
                <Link 
                  to="/signup" 
                  className="text-white text-sm font-semibold bg-[#ff6b35] px-3 py-2 rounded-full hover:bg-[#e55a2b] hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  회원가입
                </Link>
              </>
            )}
            
            <Link 
              to="/game" 
              className="flex items-center justify-center w-8 h-8 hover:scale-110 transition-all duration-200"
            >
              <img
                className="w-7 h-7 object-cover"
                alt="게임"
                src={gameIcon}
              />
            </Link>
          </div>

          {/* 모바일 햄버거 메뉴 버튼 */}
          <div className="lg:hidden flex items-center gap-2">
            {/* 게임 아이콘 (모바일에서도 표시) */}
            <Link 
              to="/game" 
              className="flex items-center justify-center w-8 h-8 hover:scale-110 transition-all duration-200"
            >
              <img
                className="w-6 h-6 object-cover"
                alt="게임"
                src={gameIcon}
              />
            </Link>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-[#ff6b35] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#ff6b35] transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">메뉴 열기</span>
              {/* 햄버거 아이콘 */}
              <svg className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* X 아이콘 */}
              <svg className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        <div className={`lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
            {/* 메인 네비게이션 */}
            <Link 
              to="/conflicts"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-bold transition-colors ${
                isActive('/conflicts') 
                  ? 'text-[#ff6b35] bg-orange-50' 
                  : 'text-[#777777] hover:text-[#ff6b35] hover:bg-gray-50'
              }`}
            >
              갈등해결
            </Link>
            
            <Link 
              to="/comfort"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-bold transition-colors ${
                isActive('/comfort') 
                  ? 'text-[#ff6b35] bg-orange-50' 
                  : 'text-[#777777] hover:text-[#ff6b35] hover:bg-gray-50'
              }`}
            >
              토닥토닥
            </Link>
            
            <Link 
              to="/community"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-bold transition-colors ${
                isActive('/community') 
                  ? 'text-[#ff6b35] bg-orange-50' 
                  : 'text-[#777777] hover:text-[#ff6b35] hover:bg-gray-50'
              }`}
            >
              커뮤니티
            </Link>
            
            <Link 
              to="/notice"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-bold transition-colors ${
                isActive('/notice') 
                  ? 'text-[#ff6b35] bg-orange-50' 
                  : 'text-[#777777] hover:text-[#ff6b35] hover:bg-gray-50'
              }`}
            >
              공지사항
            </Link>

            {/* 구분선 */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* 사용자 메뉴 */}
            {isLoggedIn ? (
              <>
                <div className="px-3 py-2">
                  <span className="text-[#4a4a4a] text-sm font-medium">
                    <span className="font-semibold text-[#ff6b35]">{user?.nickname || user?.name}</span>도치님
                  </span>
                </div>
                <Link 
                  to="/mypage"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-semibold transition-colors ${
                    location.pathname.startsWith('/mypage') 
                      ? 'text-[#ff6b35] bg-orange-50' 
                      : 'text-[#4a4a4a] hover:text-[#ff6b35] hover:bg-gray-50'
                  }`}
                >
                  마이페이지
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-semibold text-[#4a4a4a] hover:text-[#ff6b35] hover:bg-gray-50 transition-colors"
                >
                  로그인
                </Link>
                
                <Link 
                  to="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-semibold text-white bg-[#ff6b35] hover:bg-[#e55a2b] transition-colors text-center"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;