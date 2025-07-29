import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore';

const Nav = () => {
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
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🦔</span>
            <span className="text-xl font-bold text-gray-800">참견도치</span>
          </Link>

          {/* 메뉴 */}
          <div className="flex items-center gap-8">
            <Link 
              to="/" 
              className={`text-sm transition-colors ${
                isActive('/') 
                  ? 'text-amber-600 font-semibold' 
                  : 'text-gray-600 hover:text-amber-600'
              }`}
            >
              홈
            </Link>

            <Link 
              to="/service" 
              className={`text-sm transition-colors ${
                isActive('/service') 
                  ? 'text-amber-600 font-semibold' 
                  : 'text-gray-600 hover:text-amber-600'
              }`}
            >
              서비스
            </Link>

            <Link 
              to="/notice" 
              className={`text-sm transition-colors ${
                isActive('/notice') 
                  ? 'text-amber-600 font-semibold' 
                  : 'text-gray-600 hover:text-amber-600'
              }`}
            >
              공지사항
            </Link>

            <Link 
              to="/community" 
              className={`text-sm transition-colors ${
                isActive('/community') 
                  ? 'text-amber-600 font-semibold' 
                  : 'text-gray-600 hover:text-amber-600'
              }`}
            >
              커뮤니티
            </Link>

            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  안녕하세요, <span className="font-semibold text-amber-600">{user?.nickname || user?.name}</span>님
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition-colors font-medium"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="text-sm bg-amber-600 text-white px-6 py-2 rounded-full hover:bg-amber-700 transition-colors font-medium"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;