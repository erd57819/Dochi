import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MyPageNavigation from "../components/MyPageNavigation";
import myPageApi from "../services/myPageApi";
import useAuthStore from "../stores/AuthStore.js";

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { logOut } = useAuthStore();
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

  // S3에 이미지 업로드
  const uploadImageToServer = async (file) => {
  try {
    const fileName = file.name;
    const contentType = file.type;

    // 1. Presigned URL 요청
    const presignRes = await myPageApi.generateProfileImageUploadUrl({
      fileName,
      contentType
    });
    const uploadUrl = presignRes?.data?.presignedUrl;
    const imageKey = presignRes?.data?.imageKey;

     if (!uploadUrl || !imageKey) {
      throw new Error("Presigned URL 또는 imageKey가 없습니다.");
    }
    
    // 2. S3에 직접 PUT 요청
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType
      },
      body: file
    });

    console.log('✅ S3에 직접 업로드 완료');

    // 3. 업로드 완료 처리
    await myPageApi.completeProfileImageUpload(imageKey);

    console.log('✅ 백엔드에 업로드 완료 통보 완료');
    return true;

  } catch (error) {
    console.error('❌ Presigned URL 방식 이미지 업로드 실패:', error);
    throw error;
  }
};



  const handleDeleteUser = async () => {
    try {
      await myPageApi.deleteUser();
      
      // 로컬스토리지에서 토큰 제거
      logOut();
      
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
      const isNicknameChanged = formData.nickname !== originalData.nickname;
      const isAddressChanged = formData.address !== originalData.address;
      const isDataChanged = isNicknameChanged || isAddressChanged;
      
      if (isDataChanged) {
        try {
          // 디버깅: 전송할 데이터 확인
          console.log('🔍 전송 전 formData:', formData);
          console.log('🔍 원본 originalData:', originalData);
          console.log('🔍 닉네임 변경 여부:', isNicknameChanged);
          console.log('🔍 주소 변경 여부:', isAddressChanged);
          
          // 주소만 변경된 경우 닉네임 중복 검사 피하기
          if (!isNicknameChanged && isAddressChanged) {
            // 주소만 변경: 모든 필드를 보내되 닉네임은 기존 값 사용
            const requestData = {
              nickname: originalData.nickname, // 기존 닉네임 그대로
              address: formData.address || ''
            };
            console.log('🔍 주소만 업데이트 - 전송 데이터:', requestData);
            await myPageApi.updateUserInfo(requestData);
          } else {
            // 닉네임도 변경된 경우: 모든 데이터 전송
            const requestData = {
              nickname: formData.nickname || originalData.nickname,
              address: formData.address || ''
            };
            console.log('🔍 전체 업데이트 - 전송 데이터:', requestData);
            await myPageApi.updateUserInfo(requestData);
          }
          console.log('✅ 사용자 정보 업데이트 성공');
        } catch (err) {
          hasError = true;
          // 닉네임 중복 에러 체크
          if (err.message && err.message.includes('이미 사용중인 닉네임')) {
            errorMessage = '이미 사용 중인 닉네임입니다. 다른 닉네임을 사용해주세요.';
          } else {
            errorMessage = err.message || '사용자 정보 업데이트에 실패했습니다.';
          }
          console.error('❌ 사용자 정보 업데이트 실패:', err);
        }
      }
      
      // 2. 이미지가 업로드된 경우 S3에 업로드 및 DB 업데이트
      if (uploadedImage && !hasError) {
        try {
          await uploadImageToServer(uploadedImage);

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
        alert(`사용자 정보는 업데이트되었지만
이미지 업로드에 실패했습니다.
다시 시도해주세요.`);
      } else if (isDataChanged || uploadedImage) {
        alert('프로필이 성공적으로 저장되었습니다.');
      } else {
        alert('변경된 내용이 없습니다.');
      }
      
    } catch (err) {
      console.error('사용자 정보 수정 실패:', err);
      // 닉네임 중복 에러 체크
      if (err.message && err.message.includes('이미 사용중인 닉네임')) {
        setError('이미 사용 중인 닉네임입니다. 다른 닉네임을 사용해주세요.');
      } else {
        setError(err.message || '정보 수정에 실패했습니다.');
      }
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
        }) + ' 가입';
      }

      // 일반 문자열 날짜 처리
      const date = new Date(dateData);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) + ' 가입';
    } catch (e) {
      console.error('날짜 포맷팅 오류:', e, dateData);
      return '가입일 알 수 없음';
    }
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex justify-center">
        <div className="w-full max-w-[1080px] bg-white">
          <MyPageNavigation />
          <div className="flex justify-center items-center py-16">
            <div className="text-lg text-[#999999]">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex justify-center">
      <div className="w-full max-w-[1080px] bg-white">
        <MyPageNavigation />

        {/* 메인 컨텐츠 */}
        <div className="flex justify-center px-4 py-8">
          <div className="w-full max-w-[675px]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-9">
              
              {/* 왼쪽: 프로필 정보 */}
              <div className="flex flex-col items-center">
                {/* 프로필 섹션 */}
                <div className="text-center mb-6 w-full">
                  {/* 프로필 이미지 */}
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      {imagePreview ? (
                        <div className="w-[105px] h-[105px] rounded-full overflow-hidden border-4 border-white shadow-lg">
                          <img 
                            src={imagePreview} 
                            alt="프로필 이미지" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-[105px] h-[105px] rounded-full flex items-center justify-center bg-[#bf7d2c] border-4 border-white shadow-lg">
                          <span className="text-3xl font-bold text-white">
                            {formData.nickname ? formData.nickname.charAt(0) : '?'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 프로필 사진 선택 옵션 */}
                  <div className="mb-4">
                    <div className="flex justify-center">
                      <label className="text-[#333] font-medium cursor-pointer transition-colors text-sm underline hover:no-underline">
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
                  <h2 className="text-xl font-bold text-black mb-1">
                    {userInfo.name && userInfo.name !== 'string' ? userInfo.name : '이름 없음'}
                  </h2>
                  <p className="text-base text-[#666] mb-1">
                    {userInfo.age > 0 ? `${userInfo.age}세` : ''}{userInfo.age > 0 && userInfo.gender && userInfo.gender !== 'NONE' ? ', ' : ''}{userInfo.gender === 'MALE' ? '남성' : userInfo.gender === 'FEMALE' ? '여성' : ''}
                  </p>
                  <p className="text-[#666] text-xs">
                    {formatDate(userInfo.created_at)}
                  </p>
                </div>
              </div>

              {/* 오른쪽: 입력 폼 */}
              <div className="flex flex-col">
                {/* 에러 메시지 */}
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-center text-sm">
                    {error}
                  </div>
                )}

                {/* 입력 폼 */}
                <div className="space-y-4 flex-1">
                  {/* 닉네임 */}
                  <div>
                    <label className="block text-left text-[#333] font-medium mb-1 text-sm">
                      닉네임
                    </label>
                    <input
                      type="text"
                      name="nickname"
                      value={formData.nickname}
                      onChange={handleInputChange}
                      className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-sm transition-colors"
                      placeholder="닉네임을 입력해주세요"
                    />
                  </div>

                  {/* 아이디 */}
                  <div>
                    <label className="block text-left text-[#333] font-medium mb-1 text-sm">
                      아이디
                    </label>
                    <input
                      type="text"
                      value={userInfo.userId}
                      disabled
                      className="w-full px-0 py-3 bg-gray-50 border-0 border-b-2 border-b-gray-300 text-[#666] text-sm"
                    />
                  </div>

                  {/* 이메일 */}
                  <div>
                    <label className="block text-left text-[#333] font-medium mb-1 text-sm">
                      이메일
                    </label>
                    <input
                      type="email"
                      value={userInfo.email}
                      disabled
                      className="w-full px-0 py-3 bg-gray-50 border-0 border-b-2 border-b-gray-300 text-[#666] text-sm"
                    />
                  </div>

                  {/* 주소 */}
                  <div>
                    <label className="block text-left text-[#333] font-medium mb-1 text-sm">
                      주소
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address && formData.address !== "NULL" && formData.address !== "null" ? formData.address : ""}
                      readOnly
                      onClick={openDaumPostcode}
                      className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-[#bf7d2c] cursor-pointer text-sm transition-colors"
                      placeholder="주소를 검색해주세요"
                    />
                  </div>
                </div>

              </div>
              
            </div>
            
            {/* 저장 및 회원탈퇴 버튼 - 전체 페이지 폭 기준 */}
            <div className="mt-8 relative w-full">
              {/* 프로필 저장 버튼 - 전체 페이지 가운데 */}
              <div className="flex justify-center">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 text-xs"
                  style={{ 
                    backgroundColor: '#bf7d2c', 
                    color: 'white',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => !saving && (e.target.style.backgroundColor = '#D2691E')}
                  onMouseLeave={(e) => !saving && (e.target.style.backgroundColor = '#bf7d2c')}
                >
                  {saving ? '저장 중...' : '프로필 저장'}
                </button>
              </div>
              
              {/* 회원탈퇴 버튼 - 절대 위치로 오른쪽 */}
              <div className="absolute top-0 right-0">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-red-600 font-bold text-xs hover:text-red-700 transition-colors"
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
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-center mb-3">회원탈퇴</h3>
            <p className="text-gray-600 text-center mb-5 text-sm">
              정말로 탈퇴하시겠습니까?<br/>
              탈퇴 후에는 모든 데이터가 삭제되며<br/>
              복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                취소
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium transition-colors text-sm"
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
