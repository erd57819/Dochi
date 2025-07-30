import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore';
import { API_BASE_URL } from '../config/api';

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
        const { accessToken, refreshToken, profileImage, name, nickname, social: isSocial, email, userId } = loginData;
        
        // JWT 토큰을 localStorage에 저장
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // 유저 정보를 스토어에 저장
        logIn({ 
          userId: userId, 
          name: name,
          nickname: nickname,
          email: email,
          profileImage: profileImage,
          isSocial: isSocial
        });
        
        alert('로그인 성공!');
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-3">
            <span className="text-2xl">🦔</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">참견도치</h1>
          <h2 className="text-lg font-semibold text-gray-700">로그인</h2>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="userId"
              placeholder="아이디를 입력하세요"
              value={formData.userId}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400"
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              name="password"
              placeholder="비밀번호를 입력하세요"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            로그인
          </button>
        </form>

        {/* 소셜 로그인 */}
        <div className="mt-6">
          <div className="flex items-center gap-4 justify-center">
            <button className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              G
            </button>
            <button className="p-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500">
              K
            </button>
            <Link 
              to="/signup"
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
            >
              회원가입
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← 메인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;