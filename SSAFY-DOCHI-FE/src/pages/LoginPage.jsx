import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: 백엔드 API 연동
    logIn({ username: formData.username, id: 1 });
    navigate('/');
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
              name="username"
              placeholder="아이디를 입력하세요"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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