import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MyPageNavigation from "../components/MyPageNavigation";
import myPageApi from "../services/myPageApi";
import useAuthStore from "../stores/AuthStore";

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
      
      // 프로필 이미지 설정
      if (userData.profileImage) {
        setImagePreview(userData.profileImage);
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
  
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 크기 및 형식 유효성 검사
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    
    if (file.size > maxSize) {
      setError('이미지 크기는 5MB 이하로 업로드해주세요.');
      return;
    }
    
    if (!allowedTypes.includes(file.type)) {
      setError('JPG, PNG, GIF 형식의 이미지만 업로드 가능합니다.');
      return;
    }

    try {
      // 미리보기를 위한 로컬 URL 생성
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setUploadedImage(file);
      setError(null);
    } catch (err) {
      console.error('이미지 업로드 오류:', err);
      setError('이미지 업로드에 실패했습니다.');
    }
  };

  // S3에 이미지 업로드하는 함수
  const uploadImageToS3 = async (file) => {
    try {
      // 1. Presigned URL 생성
      const imageInfo = {
        fileName: file.name,
        contentType: file.type
      };
      
      const urlResponse = await myPageApi.generateProfileImageUploadUrl(imageInfo);
      const { presignedUrl, imageKey } = urlResponse.data;
      
      // 2. S3에 이미지 업로드
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });
      
      if (!uploadResponse.ok) {
        console.error('S3 업로드 실패 상세:', uploadResponse.status, uploadResponse.statusText);
        throw new Error(`S3 업로드 실패: ${uploadResponse.status}`);
      }
      
      console.log('✅ S3 업로드 성공');
      
      // 3. 업로드 완료 처리
      await myPageApi.completeProfileImageUpload(imageKey);
      
      return imageKey;
    } catch (error) {
      console.error('S3 이미지 업로드 실패:', error);
      throw error;
    }
  };

  const handleDeleteUser = async () => {
    try {
      await myPageApi.deleteUser();
      
      // 로컬스토리지에서 토큰 제거
      logout();
      
      // 로그인 페이지로 리다이렉트
      navigate('/', { replace: true });
      
      alert('회원탈퇴가 완료되었습니다.');
    } catch (err) {
      console.error('회원탈퇴 실패:', err);
      alert('회원탈퇴에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nickname.trim()) {
      setError('닉네임은 필수 입력 항목입니다.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      let hasError = false;
      let errorMessage = '';
      
      // 1. 사용자 정보가 변경된 경우만 업데이트
      const isDataChanged = formData.nickname !== originalData.nickname || formData.address !== originalData.address;
      
      if (isDataChanged) {
        try {
          await myPageApi.updateUserInfo(formData);
          console.log('✅ 사용자 정보 업데이트 성공');
        } catch (err) {
          hasError = true;
          errorMessage = err.message || '사용자 정보 업데이트에 실패했습니다.';
          console.error('❌ 사용자 정보 업데이트 실패:', err);
        }
      }
      
      // 2. 이미지가 업로드된 경우 S3에 업로드 및 DB 업데이트
      if (uploadedImage && !hasError) {
        try {
          await uploadImageToS3(uploadedImage);
          console.log('✅ 이미지 업로드 성공');
        } catch (err) {
          console.error('❌ 이미지 업로드 실패:', err);
          // 이미지 업로드 실패는 전체 저장을 막지 않음
          errorMessage = hasError ? errorMessage : '이미지 업로드에 실패했지만 다른 정보는 저장되었습니다.';
        }
      }
      
      if (hasError) {
        throw new Error(errorMessage);
      }
      
      setOriginalData(formData);
      // 사용자 정보 새로고침
      await loadUserInfo();
      
      if (uploadedImage && errorMessage.includes('이미지 업로드에 실패')) {
        alert('사용자 정보는 업데이트되었지만 \n이미지 업로드에 실패했습니다. \n다시 시도해주세요.');
      } else if (isDataChanged || uploadedImage) {
        alert('프로필이 성공적으로 저장되었습니다.');
      } else {
        alert('변경된 내용이 없습니다.');
      }
      
    } catch (err) {
      console.error('사용자 정보 수정 실패:', err);
      setError(err.message || '정보 수정에 실패했습니다.');
    } finally {
      setSaving(false);
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
                <div className="relative">
                  {imagePreview ? (
                    <div className="w-[140px] h-[140px] rounded-full overflow-hidden border-4 border-white shadow-lg">
                      <img 
                        src={imagePreview} 
                        alt="프로필 이미지" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-[140px] h-[140px] rounded-full flex items-center justify-center bg-gray-200 border-4 border-white shadow-lg">
                      <span className="text-4xl text-gray-500">🗄️</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 프로필 사진 선택 옵션 */}
              <div className="mb-6">
                <div className="flex justify-center">
                  <label className="bg-[#E6E6FA] hover:bg-[#D8BFD8] text-[#333] px-6 py-3 rounded-lg font-medium cursor-pointer transition-colors">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    {imagePreview ? '사진 변경' : '사진 업로드'}
                  </label>
                </div>
              </div>

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
                  className="w-full px-4 py-3 rounded-lg border border-[#d1d5db] focus:border-[#D2691E] focus:outline-none bg-white text-base"
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

            {/* 저장 및 회원탈퇴 버튼 */}
            <div className="space-y-4 mt-12">
              {/* 저장 버튼 */}
              <div className="flex justify-center">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#E6E6FA] hover:bg-[#D8BFD8] text-[#333] px-12 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 min-w-[200px]"
                >
                  {saving ? '저장 중...' : '프로필 저장'}
                </button>
              </div>
              
              {/* 회원탈퇴 버튼 */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-red-500 hover:text-red-700 text-sm px-4 py-2 rounded-lg transition-colors hover:bg-red-50"
                >
                  회원탈퇴
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 회원탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-center mb-4">회원탈퇴</h3>
            <p className="text-gray-600 text-center mb-6">
              정말로 탈퇴하시겠습니까?<br/>
              탈퇴 후에는 모든 데이터가 삭제되며<br/>
              복구할 수 없습니다.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileEditPage;