import React, { useState } from "react";
import MyPageNavigation from "../components/MyPageNavigation";
import myPageApi from "../services/myPageApi";

const PasswordChangePage = () => {
  const [formData, setFormData] = useState({
    password: "",
    newpassword: "",
    newpassword2: ""
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "현재 비밀번호를 입력해주세요.";
    }

    if (!formData.newpassword) {
      newErrors.newpassword = "새 비밀번호를 입력해주세요.";
    } else if (formData.newpassword.length < 8) {
      newErrors.newpassword = "비밀번호는 최소 8자 이상이어야 합니다.";
    }

    if (!formData.newpassword2) {
      newErrors.newpassword2 = "비밀번호 확인을 입력해주세요.";
    } else if (formData.newpassword !== formData.newpassword2) {
      newErrors.newpassword2 = "새 비밀번호와 일치하지 않습니다.";
    }

    if (formData.password === formData.newpassword) {
      newErrors.newpassword = "현재 비밀번호와 동일한 비밀번호로는 변경할 수 없습니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      await myPageApi.changePassword({
        currentPassword: formData.password,
        newPassword: formData.newpassword
      });
      
      alert("비밀번호가 성공적으로 변경되었습니다.");
      
      // 폼 초기화
      setFormData({
        password: "",
        newpassword: "",
        newpassword2: ""
      });
      setErrors({});
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      alert('비밀번호 변경에 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex justify-center">
      <div className="w-full max-w-[1080px] bg-white">
        
        <MyPageNavigation />

        {/* 비밀번호 변경 폼 */}
        <div className="max-w-[600px] px-6 mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 현재 비밀번호 */}
              <div>
                <label className="block text-base font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  현재 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`w-full px-0 py-3 pr-10 bg-transparent border-0 border-b-2 text-base focus:outline-none transition-colors ${
                      errors.password 
                        ? "border-b-red-500 focus:border-b-red-500" 
                        : "border-b-gray-300 focus:border-b-[#bf7d2c]"
                    } ${loading ? 'opacity-50' : ''}`}
                    style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    disabled={loading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6b7280] hover:text-[#374151] disabled:opacity-50"
                  >
                    {showPasswords.current ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.464 6.464m3.414 3.414l4.242 4.242m-4.242-4.242L9.88 9.88m4.24 4.24l4.243 4.243m0 0a10.025 10.025 0 005.384-4.03c.148-.297.179-.635.179-.973a10.025 10.025 0 00-5.179-4.973m0 9.976V17.5m0 0L6.464 6.464" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-red-500 text-xs" style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* 새 비밀번호 */}
              <div>
                <label className="block text-base font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    name="newpassword"
                    value={formData.newpassword}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`w-full px-0 py-3 pr-10 bg-transparent border-0 border-b-2 text-base focus:outline-none transition-colors ${
                      errors.newpassword 
                        ? "border-b-red-500 focus:border-b-red-500" 
                        : "border-b-gray-300 focus:border-b-[#bf7d2c]"
                    } ${loading ? 'opacity-50' : ''}`}
                    style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}
                    placeholder="새 비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    disabled={loading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6b7280] hover:text-[#374151] disabled:opacity-50"
                  >
                    {showPasswords.new ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.464 6.464m3.414 3.414l4.242 4.242m-4.242-4.242L9.88 9.88m4.24 4.24l4.243 4.243m0 0a10.025 10.025 0 005.384-4.03c.148-.297.179-.635.179-.973a10.025 10.025 0 00-5.179-4.973m0 9.976V17.5m0 0L6.464 6.464" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.newpassword && (
                  <p className="mt-1 text-red-500 text-xs" style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}>
                    {errors.newpassword}
                  </p>
                )}
                <p className="mt-1 text-[#6b7280] text-xs" style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}>
                  비밀번호는 최소 8자 이상이어야 합니다.
                </p>
              </div>

              {/* 새 비밀번호 확인 */}
              <div>
                <label className="block text-base font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    name="newpassword2"
                    value={formData.newpassword2}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`w-full px-0 py-3 pr-10 bg-transparent border-0 border-b-2 text-base focus:outline-none transition-colors ${
                      errors.newpassword2 
                        ? "border-b-red-500 focus:border-b-red-500" 
                        : "border-b-gray-300 focus:border-b-[#bf7d2c]"
                    } ${loading ? 'opacity-50' : ''}`}
                    style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}
                    placeholder="새 비밀번호를 다시 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    disabled={loading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6b7280] hover:text-[#374151] disabled:opacity-50"
                  >
                    {showPasswords.confirm ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.464 6.464m3.414 3.414l4.242 4.242m-4.242-4.242L9.88 9.88m4.24 4.24l4.243 4.243m0 0a10.025 10.025 0 005.384-4.30c.148-.297.179-.635.179-.973a10.025 10.025 0 00-5.179-4.973m0 9.976V17.5m0 0L6.464 6.464" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.newpassword2 && (
                  <p className="mt-1 text-red-500 text-xs" style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}>
                    {errors.newpassword2}
                  </p>
                )}
              </div>

              {/* 버튼 */}
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 text-xs"
                  style={{ 
                    backgroundColor: '#bf7d2c', 
                    color: 'white',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#D2691E')}
                  onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#bf7d2c')}
                >
                  {loading ? '변경 중...' : '비밀번호 변경'}
                </button>
              </div>

            </form>
        </div>

      </div>
    </div>
  );
};

export default PasswordChangePage;