import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    email: '',
    name: '',
    birthYear: '',
    gender: '',
    agreeTerms: false
  });
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: 백엔드 API 연동
    console.log('회원가입 데이터:', formData);
    navigate('/login');
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
          <h2 className="text-lg font-semibold text-gray-700">회원가입</h2>
          <p className="text-sm text-gray-500">계정을 만들어 보세요</p>
        </div>

        {/* 회원가입 폼 */}
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

          <div>
            <input
              type="password"
              name="passwordConfirm"
              placeholder="비밀번호를 재입력하세요"
              value={formData.passwordConfirm}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="이메일을 입력하세요"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <input
              type="text"
              name="name"
              placeholder="이름을 입력하세요"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <input
              type="number"
              name="birthYear"
              placeholder="생년월일을 입력하세요"
              value={formData.birthYear}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex gap-4">
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">성별</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleInputChange}
              className="mr-2"
              required
            />
            <label className="text-sm text-gray-600">
              이용약관에 동의합니다
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            회원가입
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <div>
            <span className="text-sm text-gray-500">이미 계정이 있으신가요? </span>
            <Link to="/login" className="text-sm text-orange-500 hover:text-orange-600">
              로그인
            </Link>
          </div>
          <Link to="/" className="block text-sm text-gray-500 hover:text-gray-700">
            ← 메인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;