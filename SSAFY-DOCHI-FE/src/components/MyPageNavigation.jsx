import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const MyPageNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/mypage", label: "갈등 모아보기" },
    { path: "/mypage/profile", label: "내 정보 수정" },
    { path: "/mypage/password", label: "비밀번호 변경" }
  ];

  const handleNavClick = (path) => {
    navigate(path);
  };

  return (
    <>
      {/* 마이페이지 제목 */}
      <div className="pt-20 pb-10">
        <h1 className="text-center text-4xl font-bold text-[#bf7d2c]" style={{ fontFamily: 'Pretendard-Bold, Helvetica' }}>
          마이페이지
        </h1>
      </div>

      {/* 네비게이션 메뉴 */}
      <div className="flex justify-center gap-16 mb-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`text-xl font-semibold pb-2 transition-colors ${
                isActive 
                  ? "text-[#bf7d2c] border-b-[3px] border-[#bf7d2c]" 
                  : "text-[#999999] hover:text-[#bf7d2c]"
              }`}
              style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default MyPageNavigation;