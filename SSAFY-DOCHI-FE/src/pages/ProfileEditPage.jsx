import React, { useState, useEffect } from "react";
import MyPageNavigation from "../components/MyPageNavigation";
import myPageApi from "../services/myPageApi";

const ProfileEditPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "", 
    address: "",
    age: ""
  });
  const [originalData, setOriginalData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // 사용자 정보 로드
  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await myPageApi.getUserInfo();
      const userData = response.data;
      
      const userInfo = {
        name: userData.name || "",
        email: userData.email || "",
        address: userData.address || "",
        age: userData.age || ""
      };
      
      setFormData(userInfo);
      setOriginalData(userInfo);
    } catch (err) {
      console.error('사용자 정보 로드 실패:', err);
      setError('사용자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await myPageApi.updateUserInfo(formData);
      
      setOriginalData(formData);
      setIsEditing(false);
      alert("정보가 성공적으로 수정되었습니다.");
    } catch (err) {
      console.error('사용자 정보 수정 실패:', err);
      setError(err.message || '정보 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex justify-center">
        <div className="w-full max-w-[1440px] bg-white">
          <MyPageNavigation />
          <div className="flex justify-center items-center py-20">
            <div className="text-xl text-[#999999]">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex justify-center">
      <div className="w-full max-w-[1440px] bg-white">
        
        <MyPageNavigation />

        {/* 프로필 수정 폼 */}
        <div className="max-w-[600px] mx-auto px-8">
          <div className="bg-white rounded-[20px] border border-solid border-[#e5e7eb] shadow-[0px_4px_6px_rgba(0,0,0,0.1)] p-8">
            
            {/* 프로필 이미지 */}
            <div className="flex justify-center mb-8">
              <div className="w-[120px] h-[120px] rounded-full border-[4px] border-[#fbbf24] overflow-hidden flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}}>
                <div className="text-white text-2xl font-bold">도치</div>
              </div>
            </div>

            {/* 수정 버튼 */}
            <div className="flex justify-end mb-6">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-[#bf7d2c] hover:bg-[#a16207] text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  style={{ fontFamily: 'Pretendard-Medium, Helvetica' }}
                >
                  정보 수정
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="bg-[#6b7280] hover:bg-[#4b5563] text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    style={{ fontFamily: 'Pretendard-Medium, Helvetica' }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-[#ea580c] hover:bg-[#dc2626] text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    style={{ fontFamily: 'Pretendard-Medium, Helvetica' }}
                  >
                    저장
                  </button>
                </div>
              )}
            </div>

            {/* 폼 필드들 */}
            <div className="space-y-6">
              
              {/* 이메일 */}
              <div>
                <label className="block text-lg font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-lg border text-lg ${
                    isEditing 
                      ? "border-[#d1d5db] focus:border-[#bf7d2c] focus:outline-none" 
                      : "border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280]"
                  }`}
                  style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}
                />
              </div>

              {/* 닉네임 */}
              <div>
                <label className="block text-lg font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  닉네임
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-lg border text-lg ${
                    isEditing 
                      ? "border-[#d1d5db] focus:border-[#bf7d2c] focus:outline-none" 
                      : "border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280]"
                  }`}
                  style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}
                />
              </div>

              {/* 전화번호 */}
              <div>
                <label className="block text-lg font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  전화번호
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-lg border text-lg ${
                    isEditing 
                      ? "border-[#d1d5db] focus:border-[#bf7d2c] focus:outline-none" 
                      : "border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280]"
                  }`}
                  style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}
                />
              </div>

              {/* 생년월일 */}
              <div>
                <label className="block text-lg font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  생년월일
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-lg border text-lg ${
                    isEditing 
                      ? "border-[#d1d5db] focus:border-[#bf7d2c] focus:outline-none" 
                      : "border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280]"
                  }`}
                  style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}
                />
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileEditPage;