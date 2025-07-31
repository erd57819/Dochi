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
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  // 고슴도치 아바타 옵션들
  const avatarOptions = [
    { id: 0, emoji: "🦔", bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
    { id: 1, emoji: "🦔", bg: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" },
    { id: 2, emoji: "🦔", bg: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" },
    { id: 3, emoji: "🦔", bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
    { id: 4, emoji: "🦔", bg: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" },
    { id: 5, emoji: "🦔", bg: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)" },
  ];

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
      
      // 디버깅을 위해 콘솔 출력
      console.log('🔍 백엔드에서 받은 사용자 데이터:', userData);
      console.log('🔍 이름:', userData.name);
      console.log('🔍 나이:', userData.age);
      console.log('🔍 성별:', userData.gender);
      console.log('🔍 생성일:', userData.created_at);
      
      setUserInfo({
        userId: userData.userId || "",
        name: userData.name || "",
        email: userData.email || "",
        profileImage: userData.profileImage || "",
        age: userData.age || 0,
        gender: userData.gender || "",
        created_at: userData.created_at || ""
      });

      const editableData = {
        nickname: userData.nickname || "",
        address: userData.address || ""
      };
      
      setFormData(editableData);
      setOriginalData(editableData);
      
      // 프로필 이미지에서 아바타 ID 추출
      if (userData.profileImage) {
        const avatarId = parseInt(userData.profileImage.replace('avatar_', '')) || 0;
        setSelectedAvatar(avatarId);
      }
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
  
  const openDaumPostcode = () => {
    new window.daum.Postcode({
      oncomplete: function (data) {
        const fullAddress = data.address; // 전체 주소
        setFormData(prev => ({
          ...prev,
          address: fullAddress
        }));
      }
    }).open();
  };
  const handleAvatarSelect = (avatarId) => {
    setSelectedAvatar(avatarId);
  };

  const handleSave = async () => {
    if (!formData.nickname.trim()) {
      setError('닉네임은 필수 입력 항목입니다.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const updateData = {
        ...formData,
        profileImage: `avatar_${selectedAvatar}`
      };
      
      await myPageApi.updateUserInfo(updateData);
      
      setOriginalData(formData);
      setUserInfo(prev => ({
        ...prev,
        profileImage: `avatar_${selectedAvatar}`
      }));
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
    // 아바타도 원래대로
    if (userInfo.profileImage) {
      const avatarId = parseInt(userInfo.profileImage.replace('avatar_', '')) || 0;
      setSelectedAvatar(avatarId);
    }
  };

  const formatDate = (dateData) => {
    if (!dateData) return '';
    try {
      // LocalDateTime 배열 형식 [2025, 7, 31, 17, 18, 34] 처리
      if (Array.isArray(dateData) && dateData.length >= 3) {
        const [year, month, day] = dateData;
        const date = new Date(year, month - 1, day); // JS는 month가 0부터 시작
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).replace(/\s/g, '') + ' 가입';
      }

      // 일반 문자열 날짜 처리
      const date = new Date(dateData);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).replace(/\s/g, '') + ' 가입';
    } catch (e) {
      console.error('날짜 포맷팅 오류:', e, dateData);
      return '가입일 알 수 없음';
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

        {/* 메인 컨텐츠 */}
        <div className="flex justify-center px-4 py-12">
          <div className="w-full max-w-[500px]">
            


            {/* 프로필 섹션 */}
            <div className="text-center mb-8">
              {/* 프로필 이미지 */}
              <div className="flex justify-center mb-6">
                <div 
                  className="w-[140px] h-[140px] rounded-full flex items-center justify-center text-6xl border-4 border-white shadow-lg"
                  style={{ background: avatarOptions[selectedAvatar]?.bg }}
                >
                  {avatarOptions[selectedAvatar]?.emoji}
                </div>
              </div>

              {/* 프로필 사진 변경 옵션 (편집 모드일 때만) */}
              {isEditing && (
                <div className="mb-6">
                  <p className="text-sm text-[#666] mb-3">프로필 사진 선택</p>
                  <div className="flex justify-center gap-3 flex-wrap">
                    {avatarOptions.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => handleAvatarSelect(avatar.id)}
                        className={`w-[60px] h-[60px] rounded-full flex items-center justify-center text-2xl border-2 transition-all ${
                          selectedAvatar === avatar.id 
                            ? 'border-[#D2691E] shadow-lg scale-110' 
                            : 'border-gray-300 hover:border-[#D2691E]'
                        }`}
                        style={{ background: avatar.bg }}
                      >
                        {avatar.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 사용자 정보 */}
              <h2 className="text-2xl font-bold text-black mb-2">
                {userInfo.name && userInfo.name !== 'string' ? userInfo.name : '이름 없음'}, {userInfo.age > 0 ? `${userInfo.age}세` : ''}{userInfo.age > 0 && userInfo.gender && userInfo.gender !== 'NONE' ? ', ' : ''}{userInfo.gender === 'MALE' ? '남성' : userInfo.gender === 'FEMALE' ? '여성' : ''}
              </h2>
              <p className="text-[#666] text-sm">
                {formatDate(userInfo.created_at)}
              </p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
                {error}
              </div>
            )}

            {/* 입력 폼 */}
            <div className="space-y-6">
              {/* 닉네임 */}
              <div>
                <label className="block text-left text-[#333] font-medium mb-2">
                  닉네임
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border text-base ${
                    isEditing 
                      ? "border-[#d1d5db] focus:border-[#D2691E] focus:outline-none bg-white" 
                      : "border-[#e5e7eb] bg-[#f9fafb] text-[#666]"
                  }`}
                  placeholder="닉네임을 입력해주세요"
                />
              </div>

              {/* 아이디 */}
              <div>
                <label className="block text-left text-[#333] font-medium mb-2">
                  아이디
                </label>
                <input
                  type="text"
                  value={userInfo.userId}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] text-[#666] text-base"
                />
              </div>

              {/* 이메일 */}
              <div>
                <label className="block text-left text-[#333] font-medium mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={userInfo.email}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] text-[#666] text-base"
                />
              </div>

              {/* 주소 */}
              <div>
                <label className="block text-left text-[#333] font-medium mb-2">
                  주소
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  readOnly
                  onClick={openDaumPostcode}
                  className="w-full px-4 py-3 rounded-lg border border-[#d1d5db] cursor-pointer bg-white"
                  placeholder="주소를 검색해주세요"
                />
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-center mt-12">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-[#E6E6FA] hover:bg-[#D8BFD8] text-[#333] px-8 py-3 rounded-lg font-medium transition-colors min-w-[120px]"
                >
                  변경 사항 저장
                </button>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#374151] px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 min-w-[100px]"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#E6E6FA] hover:bg-[#D8BFD8] text-[#333] px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 min-w-[120px]"
                  >
                    {saving ? '저장 중...' : '변경 사항 저장'}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;