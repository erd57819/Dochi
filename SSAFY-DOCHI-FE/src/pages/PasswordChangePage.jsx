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
      <div className="w-full max-w-[1440px] bg-white">
        
        <MyPageNavigation />

        {/* 비밀번호 변경 폼 */}
        <div className="max-w-[600px] mx-auto px-8">
          <div className="bg-white rounded-[20px] border border-solid border-[#e5e7eb] shadow-[0px_4px_6px_rgba(0,0,0,0.1)] p-8">
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 현재 비밀번호 */}
              <div>
                <label className="block text-lg font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  현재 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border text-lg focus:outline-none transition-colors ${
                      errors.password 
                        ? "border-red-500 focus:border-red-500" 
                        : "border-[#d1d5db] focus:border-[#bf7d2c]"
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
                    {showPasswords.current ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-red-500 text-sm" style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* 새 비밀번호 */}
              <div>
                <label className="block text-lg font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    name="newpassword"
                    value={formData.newpassword}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border text-lg focus:outline-none transition-colors ${
                      errors.newpassword 
                        ? "border-red-500 focus:border-red-500" 
                        : "border-[#d1d5db] focus:border-[#bf7d2c]"
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
                    {showPasswords.new ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.newpassword && (
                  <p className="mt-1 text-red-500 text-sm" style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}>
                    {errors.newpassword}
                  </p>
                )}
                <p className="mt-1 text-[#6b7280] text-sm" style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}>
                  비밀번호는 최소 8자 이상이어야 합니다.
                </p>
              </div>

              {/* 새 비밀번호 확인 */}
              <div>
                <label className="block text-lg font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    name="newpassword2"
                    value={formData.newpassword2}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border text-lg focus:outline-none transition-colors ${
                      errors.newpassword2 
                        ? "border-red-500 focus:border-red-500" 
                        : "border-[#d1d5db] focus:border-[#bf7d2c]"
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
                    {showPasswords.confirm ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.newpassword2 && (
                  <p className="mt-1 text-red-500 text-sm" style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}>
                    {errors.newpassword2}
                  </p>
                )}
              </div>

              {/* 버튼 */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#ea580c] hover:bg-[#dc2626] disabled:opacity-50 disabled:cursor-not-allowed text-white px-12 py-4 rounded-full text-lg font-medium transition-colors shadow-lg"
                  style={{ fontFamily: 'Pretendard-Medium, Helvetica' }}
                >
                  {loading ? '변경 중...' : '비밀번호 변경'}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PasswordChangePage;