import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore.js';
import { API_BASE_URL } from '../config/api.js';
import KakaoLoginButton from '../components/auth/KakaoLoginButton';
import hedgehogImg from '../assets/image-65.png';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    userId: '',
    password: ''
  });
  const navigate = useNavigate();
  const { logIn } = useAuthStore();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: formData.userId,
          password: formData.password
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Login response:', result); // 디버깅용 로그
        
        // ApiResponse 구조에 맞게 접근 - data 필드 사용
        const loginData = result.data || result.response?.response || result.response || result;
        const { accessToken, refreshToken, profileImage, name, nickname, social: isSocial, email, userId, role } = loginData;
        // JWT 토큰에서 memberId 추출
         console.log('🔍 파싱 직전 accessToken 변수:', accessToken);
        let memberId = null;
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          memberId = payload.memberId;
        } catch (error) {
          console.error('JWT 토큰 파싱 실패:', error);
        }

        // JWT 토큰을 localStorage에 저장 (AuthStore에서 처리됨)
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // 유저 정보와 토큰을 스토어에 저장
        logIn({ 
          id: memberId,
          userId: userId, 
          name: name,
          nickname: nickname,
          email: email,
          profileImage: profileImage,
          isSocial: isSocial,
          role: role || 'USER'
        }, accessToken);
        
        // 메인 페이지로 이동
        navigate('/');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative" style={{ zoom: '0.85' }}>
      {/* 전체 배경 컨테이너 */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-0 left-0 w-full" 
          style={{ 
            height: '100%',
            opacity: 0.14
          }}
        ></div>
      </div>
      
      {/* 메인 컨텐츠 */}
      <main className="max-w-5xl mx-auto px-3 py-4 relative z-10 flex items-center min-h-screen">
        <div className="flex justify-center w-full">
          <div className="w-full max-w-4xl">
            <div className="bg-white rounded-xl p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* 왼쪽: 로고 및 서비스 소개 */}
                <div className="flex flex-col items-center">
                  <div className="text-center mb-8 w-full">
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <img 
                          src={hedgehogImg} 
                          alt="참견도치" 
                          className="w-50 h-50 object-contain"
                        />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-black mb-2">참견도치</h2>
                    <p className="text-lg text-[#666] mb-2">AI 기반 갈등 해결 서비스</p>
                  </div>
                </div>

                {/* 오른쪽: 로그인 폼 */}
                <div className="flex flex-col">
                  <form onSubmit={handleSubmit} className="space-y-6 flex-1 mt-8">
                    {/* 아이디 */}
                    <div>
                      <label className="block text-center text-[#333] font-medium mb-2 text-lg">
                        아이디
                      </label>
                      <div className="flex justify-center">
                        <input
                          type="text"
                          name="userId"
                          value={formData.userId}
                          onChange={handleInputChange}
                          className="w-full max-w-sm px-0 py-4 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-base transition-colors text-center"
                          placeholder="아이디를 입력해주세요"
                          required
                        />
                      </div>
                    </div>

                    {/* 비밀번호 */}
                    <div>
                      <label className="block text-center text-[#333] font-medium mb-2 text-lg">
                        비밀번호
                      </label>
                      <div className="flex justify-center">
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full max-w-sm px-0 py-4 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-base transition-colors text-center"
                          placeholder="비밀번호를 입력해주세요"
                          required
                        />
                      </div>
                    </div>
                  </form>
                </div>
              </div>
              
              {/* 로그인 버튼 및 소셜 로그인 - 전체 페이지 폭 기준 */}
              <div className="mt-10 relative w-full">
                {/* 로그인 버튼 - 전체 페이지 가운데 */}
                <div className="flex justify-center mb-8">
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 rounded-lg font-medium transition-colors text-sm"
                    style={{ 
                      backgroundColor: '#bf7d2c', 
                      color: 'white',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#D2691E')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = '#bf7d2c')}
                  >
                    로그인
                  </button>
                </div>
                
                {/* 구분선 */}
                <div className="flex items-center mb-6">
                  <div className="flex-1 border-t border-dashed border-gray-300"></div>
                  <span className="px-4 text-sm text-gray-400">또는</span>
                  <div className="flex-1 border-t border-dashed border-gray-300"></div>
                </div>

                {/* 소셜 로그인 */}
                <div className="flex justify-center mb-8">
                  <KakaoLoginButton/>
                </div>

                {/* 회원가입 안내 */}
                <div className="text-center mb-8">
                  <span className="text-sm text-black">아직 계정이 없다면? </span>
                  <Link 
                    to="/signup"
                    className="text-sm font-medium hover:underline transition-colors"
                    style={{ color: '#bf7d2c' }}
                    onMouseEnter={(e) => (e.target.style.color = '#D2691E')}
                    onMouseLeave={(e) => (e.target.style.color = '#bf7d2c')}
                  >
                    회원가입 하러 가기
                  </Link>
                </div>

                {/* 메인으로 돌아가기 */}
                <div className="text-left">
                  <Link to="/" className="text-sm text-[#666] hover:text-[#bf7d2c] transition-colors">
                    ← 메인으로 돌아가기
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;