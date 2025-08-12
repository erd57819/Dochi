import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api.js';
import useAuthStore from '../stores/AuthStore.js';
import hedgehogImg from '../assets/image-65.png';

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
  const { logIn } = useAuthStore();

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
        // 회원가입 성공 후 자동 로그인 처리
        try {
          const loginResponse = await fetch(`${API_BASE_URL}/user/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: formData.userId,
              password: formData.password
            }),
          });

          if (loginResponse.ok) {
            const loginResult = await loginResponse.json();
            const loginData = loginResult.data || loginResult.response?.response || loginResult.response || loginResult;
            const { accessToken, refreshToken, profileImage, name, nickname, social: isSocial, email, userId, role } = loginData;
            
            // JWT 토큰에서 memberId 추출
            let memberId = null;
            try {
              const payload = JSON.parse(atob(accessToken.split('.')[1]));
              memberId = payload.memberId;
            } catch (error) {
              console.error('JWT 토큰 파싱 실패:', error);
            }

            // JWT 토큰을 localStorage에 저장
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
            
            alert('회원가입이 완료되었습니다. 자동 로그인되었습니다.');
            navigate('/');
          } else {
            // 자동 로그인 실패시 로그인 페이지로
            alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
            navigate('/login');
          }
        } catch (loginError) {
          console.error('자동 로그인 실패:', loginError);
          alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
          navigate('/login');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '회원가입에 실패했습니다.');
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
          <div className="w-full max-w-5xl">
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
                          className="w-32 h-32 object-contain"
                        />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-black mb-2">참견도치</h2>
                    <p className="text-lg text-[#666] mb-2">AI 기반 갈등 해결 서비스</p>
                    <p className="text-[#666] text-base">계정을 만들어 서비스를 시작하세요</p>
                  </div>
                </div>

                {/* 오른쪽: 회원가입 폼 */}
                <div className="flex flex-col">
                  <div className="space-y-5 flex-1">
                    {/* 아이디 */}
                    <div>
                      <label className="block text-center text-[#333] font-medium mb-2 text-base">
                        아이디
                      </label>
                      <div className="flex justify-center">
                        <input
                          type="text"
                          name="userId"
                          value={formData.userId}
                          onChange={handleInputChange}
                          className="w-full max-w-sm px-0 py-3 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-base transition-colors text-center"
                          placeholder="아이디를 입력해주세요"
                          required
                        />
                      </div>
                    </div>

                    {/* 비밀번호 */}
                    <div>
                      <label className="block text-center text-[#333] font-medium mb-2 text-base">
                        비밀번호
                      </label>
                      <div className="flex justify-center">
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full max-w-sm px-0 py-3 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-base transition-colors text-center"
                          placeholder="비밀번호를 입력해주세요"
                          required
                        />
                      </div>
                    </div>

                    {/* 비밀번호 확인 */}
                    <div>
                      <label className="block text-center text-[#333] font-medium mb-2 text-base">
                        비밀번호 확인
                      </label>
                      <div className="flex justify-center">
                        <input
                          type="password"
                          name="passwordConfirm"
                          value={formData.passwordConfirm}
                          onChange={handleInputChange}
                          className="w-full max-w-sm px-0 py-3 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-base transition-colors text-center"
                          placeholder="비밀번호를 재입력해주세요"
                          required
                        />
                      </div>
                    </div>

                    {/* 이메일 */}
                    <div>
                      <label className="block text-center text-[#333] font-medium mb-2 text-base">
                        이메일
                      </label>
                      <div className="flex justify-center gap-3">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="flex-1 max-w-sm px-0 py-3 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-base transition-colors text-center"
                          placeholder="이메일을 입력해주세요"
                          required
                          disabled={emailVerification.isVerified}
                        />
                        <button
                          type="button"
                          onClick={handleSendVerification}
                          disabled={emailVerification.isLoading || emailVerification.isVerified}
                          className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                          style={{ 
                            backgroundColor: emailVerification.isVerified ? '#4ade80' : '#bf7d2c', 
                            color: 'white',
                            border: 'none'
                          }}
                        >
                          {emailVerification.isLoading ? '전송중...' : emailVerification.isVerified ? '인증완료' : '인증발송'}
                        </button>
                      </div>
                      {emailVerification.isSent && !emailVerification.isVerified && (
                        <div className="mt-3 flex justify-center gap-3">
                          <input
                            type="text"
                            value={emailVerification.code}
                            onChange={(e) => setEmailVerification({ ...emailVerification, code: e.target.value })}
                            placeholder="인증코드를 입력하세요"
                            className="flex-1 max-w-sm px-0 py-2 bg-transparent border-0 border-b border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-sm transition-colors text-center"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyCode}
                            className="px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                            style={{ 
                              backgroundColor: '#4ade80', 
                              color: 'white',
                              border: 'none'
                            }}
                          >
                            확인
                          </button>
                        </div>
                      )}
                      {emailVerification.message && (
                        <p className={`mt-2 text-sm text-center ${
                          emailVerification.isVerified ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {emailVerification.message}
                        </p>
                      )}
                    </div>

                    {/* 이름 */}
                    <div>
                      <label className="block text-center text-[#333] font-medium mb-2 text-base">
                        이름
                      </label>
                      <div className="flex justify-center">
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full max-w-sm px-0 py-3 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-base transition-colors text-center"
                          placeholder="이름을 입력해주세요"
                          required
                        />
                      </div>
                    </div>

                    {/* 닉네임 */}
                    <div>
                      <label className="block text-center text-[#333] font-medium mb-2 text-base">
                        닉네임
                      </label>
                      <div className="flex justify-center">
                        <input
                          type="text"
                          name="nickname"
                          value={formData.nickname}
                          onChange={handleInputChange}
                          className="w-full max-w-sm px-0 py-3 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-base transition-colors text-center"
                          placeholder="닉네임을 입력해주세요"
                          required
                        />
                      </div>
                    </div>

                    {/* 주소 */}
                    <div>
                      <label className="block text-center text-[#333] font-medium mb-2 text-base">
                        주소
                      </label>
                      <div className="flex justify-center">
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full max-w-sm px-0 py-3 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-base transition-colors text-center"
                          placeholder="주소를 입력해주세요"
                          required
                        />
                      </div>
                    </div>

                    {/* 나이 */}
                    <div>
                      <label className="block text-center text-[#333] font-medium mb-2 text-base">
                        나이
                      </label>
                      <div className="flex justify-center">
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleInputChange}
                          className="w-full max-w-sm px-0 py-3 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-base transition-colors text-center"
                          placeholder="나이를 입력해주세요"
                          required
                        />
                      </div>
                    </div>

                    {/* 성별 */}
                    <div>
                      <label className="block text-center text-[#333] font-medium mb-2 text-base">
                        성별
                      </label>
                      <div className="flex justify-center">
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full max-w-sm px-0 py-3 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-base transition-colors text-center"
                          required
                        >
                          <option value="">성별을 선택해주세요</option>
                          <option value="male">남성</option>
                          <option value="female">여성</option>
                          <option value="none">선택안함</option>
                        </select>
                      </div>
                    </div>

                    {/* 약관 동의 */}
                    <div className="flex justify-center items-center mt-6">
                      <input
                        type="checkbox"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={handleInputChange}
                        className="mr-3 h-5 w-5 text-[#bf7d2c] focus:ring-[#bf7d2c] border-gray-300 rounded"
                        required
                      />
                      <label className="text-base text-[#666]">
                        이용약관에 동의합니다
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 회원가입 버튼 - 전체 페이지 폭 기준 */}
              <div className="mt-10 relative w-full">
                {/* 회원가입 버튼 - 전체 페이지 가운데 */}
                <div className="flex justify-center mb-8">
                  <button
                    onClick={handleSubmit}
                    className="px-8 py-3 rounded-lg font-medium transition-colors text-base"
                    style={{ 
                      backgroundColor: '#bf7d2c', 
                      color: 'white',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#D2691E')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = '#bf7d2c')}
                  >
                    회원가입
                  </button>
                </div>

                {/* 로그인 링크 및 메인으로 돌아가기 */}
                <div className="text-center space-y-3">
                  <div>
                    <span className="text-sm text-[#666]">이미 계정이 있으신가요? </span>
                    <Link to="/login" className="text-sm text-[#bf7d2c] hover:text-[#D2691E] transition-colors">
                      로그인
                    </Link>
                  </div>
                  <Link to="/" className="block text-sm text-[#666] hover:text-[#bf7d2c] transition-colors">
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

export default SignupPage;