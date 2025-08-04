import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api.js';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    passwordConfirm: '',
    email: '',
    name: '',
    nickname: '',
    age: '',
    gender: '',
    address: '',
    agreeTerms: false
  });

  const [emailVerification, setEmailVerification] = useState({
    isSent: false,
    isVerified: false,
    code: '',
    isLoading: false,
    message: ''
  });
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSendVerification = async () => {
    if (!formData.email) {
      alert('이메일을 입력해주세요.');
      return;
    }

    setEmailVerification({ ...emailVerification, isLoading: true, message: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/user/verify/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        setEmailVerification({
          ...emailVerification,
          isSent: true,
          isLoading: false,
          message: '인증코드가 발송되었습니다.'
        });
      } else {
        throw new Error('인증코드 발송에 실패했습니다.');
      }
    } catch (error) {
      setEmailVerification({
        ...emailVerification,
        isLoading: false,
        message: error.message
      });
    }
  };

  const handleVerifyCode = async () => {
    if (!emailVerification.code) {
      alert('인증코드를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user/verify/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          code: emailVerification.code
        }),
      });

      if (response.ok) {
        setEmailVerification({
          ...emailVerification,
          isVerified: true,
          message: '이메일 인증이 완료되었습니다.'
        });
      } else {
        throw new Error('인증코드가 올바르지 않습니다.');
      }
    } catch (error) {
      setEmailVerification({
        ...emailVerification,
        message: error.message
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!emailVerification.isVerified) {
      alert('이메일 인증을 완료해주세요.');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const signupData = {
        userId: formData.userId,
        name: formData.name,
        nickname: formData.nickname,
        email: formData.email,
        password: formData.password,
        address: formData.address,
        age: parseInt(formData.age),
        gender: formData.gender.toUpperCase()
      };

      const response = await fetch(`${API_BASE_URL}/user/regist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      if (response.ok) {
        alert('회원가입이 완료되었습니다.');
        navigate('/login');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '회원가입에 실패했습니다.');
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
          <h2 className="text-lg font-semibold text-gray-700">회원가입</h2>
          <p className="text-sm text-gray-500">계정을 만들어 보세요</p>
        </div>

        {/* 회원가입 폼 */}
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

          <div>
            <input
              type="password"
              name="passwordConfirm"
              placeholder="비밀번호를 재입력하세요"
              value={formData.passwordConfirm}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400"
              required
            />
          </div>

          <div>
            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                placeholder="이메일을 입력하세요"
                value={formData.email}
                onChange={handleInputChange}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400"
                required
                disabled={emailVerification.isVerified}
              />
              <button
                type="button"
                onClick={handleSendVerification}
                disabled={emailVerification.isLoading || emailVerification.isVerified}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors whitespace-nowrap"
              >
                {emailVerification.isLoading ? '전송중...' : emailVerification.isVerified ? '인증완료' : '인증발송'}
              </button>
            </div>
            {emailVerification.isSent && !emailVerification.isVerified && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={emailVerification.code}
                  onChange={(e) => setEmailVerification({ ...emailVerification, code: e.target.value })}
                  placeholder="인증코드를 입력하세요"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap"
                >
                  확인
                </button>
              </div>
            )}
            {emailVerification.message && (
              <p className={`mt-1 text-sm ${
                emailVerification.isVerified ? 'text-green-600' : 'text-red-500'
              }`}>
                {emailVerification.message}
              </p>
            )}
          </div>

          <div>
            <input
              type="text"
              name="name"
              placeholder="이름을 입력하세요"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400"
              required
            />
          </div>

          <div>
            <input
              type="text"
              name="nickname"
              placeholder="닉네임을 입력하세요"
              value={formData.nickname}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400"
              required
            />
          </div>

          <div>
            <input
              type="text"
              name="address"
              placeholder="주소를 입력하세요"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400"
            />
          </div>

          <div>
            <input
              type="number"
              name="age"
              placeholder="나이를 입력하세요"
              value={formData.age}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400"
            />
          </div>

          <div className="flex gap-4">
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
            >
              <option value="">성별</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="none">선택안함</option>
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