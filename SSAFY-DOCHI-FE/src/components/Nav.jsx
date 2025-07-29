import React from 'react';
import { Link, useLocation } from 'react-router-dom';

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

            <Link 
              to="/login" 
              className="text-sm bg-amber-600 text-white px-6 py-2 rounded-full hover:bg-amber-700 transition-colors font-medium"
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nav;