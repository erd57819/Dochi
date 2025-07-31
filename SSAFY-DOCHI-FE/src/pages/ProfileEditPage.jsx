import React, { useState, useEffect } from "react";
import MyPageNavigation from "../components/MyPageNavigation";
import myPageApi from "../services/myPageApi";

const ProfileEditPage = () => {
  const [formData, setFormData] = useState({
    nickname: "",
    address: ""
  });
  const [userInfo, setUserInfo] = useState({
    userId: "",
    name: "",
    email: "",
    profileImage: "",
    age: 0,
    gender: "",
    created_at: ""
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
      
      // 읽기 전용 정보
      setUserInfo({
        userId: userData.userId || "",
        name: userData.name || "",
        email: userData.email || "",
        profileImage: userData.profileImage || "",
        age: userData.age || 0,
        gender: userData.gender || "",
        created_at: userData.created_at || ""
      });

      // 수정 가능한 정보
      const editableData = {
        nickname: userData.nickname || "",
        address: userData.address || ""
      };
      
      setFormData(editableData);
      setOriginalData(editableData);
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
    if (!formData.nickname.trim()) {
      setError('닉네임은 필수 입력 항목입니다.');
      return;
    }

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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
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
                {userInfo.profileImage ? (
                  <img 
                    src={userInfo.profileImage} 
                    alt="프로필" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-2xl font-bold">도치</div>
                )}
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}

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
                    disabled={saving}
                    className="bg-[#6b7280] hover:bg-[#4b5563] text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    style={{ fontFamily: 'Pretendard-Medium, Helvetica' }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#ea580c] hover:bg-[#dc2626] text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    style={{ fontFamily: 'Pretendard-Medium, Helvetica' }}
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              )}
            </div>

            {/* 폼 필드들 */}
            <div className="space-y-6">
              
              {/* 사용자 ID (읽기 전용) */}
              <div>
                <label className="block text-lg font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  사용자 ID
                </label>
                <input
                  type="text"
                  value={userInfo.userId}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280] text-lg"
                  style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}
                />
              </div>

              {/* 이름 (읽기 전용) */}
              <div>
                <label className="block text-lg font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  이름
                </label>
                <input
                  type="text"
                  value={userInfo.name}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280] text-lg"
                  style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}
                />
              </div>

              {/* 이메일 (읽기 전용) */}
              <div>
                <label className="block text-lg font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  이메일
                </label>
                <input
                  type="email"
                  value={userInfo.email}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280] text-lg"
                  style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}
                />
              </div>

              {/* 닉네임 (수정 가능) */}
              <div>
                <label className="block text-lg font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  닉네임 <span className="text-red-500">*</span>
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
                  placeholder="닉네임을 입력해주세요"
                />
              </div>

              {/* 주소 (수정 가능) */}
              <div>
                <label className="block text-lg font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  주소
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-lg border text-lg ${
                    isEditing 
                      ? "border-[#d1d5db] focus:border-[#bf7d2c] focus:outline-none" 
                      : "border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280]"
                  }`}
                  style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}
                  placeholder="주소를 입력해주세요"
                />
              </div>

              {/* 나이 (읽기 전용) */}
              <div>
                <label className="block text-lg font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  나이
                </label>
                <input
                  type="text"
                  value={userInfo.age ? `${userInfo.age}세` : ''}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280] text-lg"
                  style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}
                />
              </div>

              {/* 성별 (읽기 전용) */}
              <div>
                <label className="block text-lg font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  성별
                </label>
                <input
                  type="text"
                  value={userInfo.gender === 'M' ? '남성' : userInfo.gender === 'F' ? '여성' : ''}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280] text-lg"
                  style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}
                />
              </div>

              {/* 가입일 (읽기 전용) */}
              <div>
                <label className="block text-lg font-semibold text-[#374151] mb-2" style={{ fontFamily: 'Pretendard-SemiBold, Helvetica' }}>
                  가입일
                </label>
                <input
                  type="text"
                  value={formatDate(userInfo.created_at)}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280] text-lg"
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