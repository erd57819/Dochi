import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { communityApi } from '../services/communityApi.js';
import useAuthStore from '../stores/AuthStore.js';
import hedgehogImg from '../assets/conflict.png';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL'
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // 갈등 공유하기에서 전달된 데이터 처리
  useEffect(() => {
    const prefilledData = location.state?.prefilledData;
    if (prefilledData) {
      setFormData({
        title: prefilledData.title || '',
        content: prefilledData.content || '',
        category: prefilledData.category || 'GENERAL'
      });
    }
  }, [location.state]);

  const categories = [
    { value: 'GENERAL', label: '자유게시판', color: '#7F5539', gradient: 'linear-gradient(135deg, #7F5539 0%, #a06d4d 100%)' },
    { value: 'CONFLICT_SHARING', label: '찬반대결', color: '#cd9f6e', gradient: 'linear-gradient(135deg, #cd9f6e 0%, #e6b88a 100%)' },
    { value: 'SUCCESS_STORIES', label: '해결했어요', color: '#f8d6b3', gradient: 'linear-gradient(135deg, #f8d6b3 0%, #ffe4cc 100%)' },
    { value: 'ADVICE_REQUEST', label: '조언해줘', color: '#EE9278', gradient: 'linear-gradient(135deg, #EE9278 0%, #f5a893 100%)' }
  ];

  // 로그인 확인
  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  // 갈등 공유 게시글인지 확인
  const isConflictSharingPost = formData.category === 'CONFLICT_SHARING';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      await communityApi.createPost(formData);
      alert('게시글이 성공적으로 작성되었습니다!');
      navigate('/community');
    } catch (error) {
      alert('게시글 작성에 실패했습니다: ' + error.message);
      console.error('게시글 작성 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative">
      {/* 배경 애니메이션 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-10 left-20 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        {/* 헤더 */}
        <div className="px-8 py-4 mb-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-5xl font-bold mb-2" 
                  style={{ 
                    background: 'black',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {isConflictSharingPost ? '갈등 상황 공유하기' : '새 게시글 작성'}
                </h2>
                <p className="text-gray-600">
                  {isConflictSharingPost 
                    ? '갈등 상황을 공유하고 커뮤니티의 조언을 구해보세요' 
                    : '갈등 해결 경험과 조언을 커뮤니티와 나누어보세요'
                  }
                </p>
              </div>
            </div>
            {/* 작성자 정보 */}
            <div className="text-right">
              <p className="text-sm text-gray-500">작성자</p>
              <p className="font-bold" style={{ color: '#8B4513' }}>
                {user?.nickname || user?.name || user?.email}님
              </p>
            </div>
          </div>
        </div>

        {/* 카테고리별 안내 */}
        {formData.category === 'CONFLICT_SHARING' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">💡</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">찬반대결 게시글 안내</h3>
                <ul className="text-gray-600 space-y-1 text-xs">
                  <li>• 개인정보나 실명은 절대 포함하지 마세요</li>
                  <li>• 객관적이고 균형잡힌 시각으로 상황을 설명해주세요</li>
                  <li>• A안/B안 형태로 선택지를 제시하면 더 많은 의견을 받을 수 있어요</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {formData.category === 'ADVICE_REQUEST' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">🤝</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">조언 요청 게시글 안내</h3>
                <ul className="text-gray-600 space-y-1 text-xs">
                  <li>• 상황을 구체적이고 명확하게 설명해주세요</li>
                  <li>• 어떤 도움이 필요한지 직접적으로 말해주세요</li>
                  <li>• 이미 시도해본 방법들도 함께 공유해주세요</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {formData.category === 'SUCCESS_STORIES' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">🎉</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">해결 성공사례 게시글 안내</h3>
                <ul className="text-gray-600 space-y-1 text-xs">
                  <li>• 해결 과정을 단계별로 상세히 공유해주세요</li>
                  <li>• 다른 사람에게 도움이 될 수 있는 팁을 포함해주세요</li>
                  <li>• 어려웠던 점과 극복한 방법을 솔직하게 작성해주세요</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {formData.category === 'GENERAL' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">💬</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">자유게시판 게시글 안내</h3>
                <ul className="text-gray-600 space-y-1 text-xs">
                  <li>• 서로 존중하는 대화로 자유롭게 소통해주세요</li>
                  <li>• 일상 경험과 고민을 나누며 공감대를 형성해보세요</li>
                  <li>• 긍정적이고 건설적인 내용으로 작성해주세요</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 작성 폼 */}
        <div className="bg-white rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 카테고리 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map(category => (
                  <label
                    key={category.value}
                    className="cursor-pointer p-4 rounded-lg border-2 text-center transition-all duration-250 ease-in-out transform hover:scale-105 hover:rotate-1"
                    style={{
                      background: formData.category === category.value ? category.gradient : '#FFFFFF',
                      borderColor: formData.category === category.value ? category.color : '#E5E7EB',
                      color: formData.category === category.value ? '#FFFFFF' : category.color
                    }}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.value}
                      checked={formData.category === category.value}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <div className="font-bold text-base">{category.label}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* 제목 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="게시글 제목을 입력하세요"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-300 focus:bg-orange-50 text-gray-800 placeholder-gray-400 transition-all duration-250 ease-in-out"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/100자
              </p>
            </div>

            {/* 내용 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="게시글 내용을 입력하세요&#10;&#10;• 갈등 상황을 구체적으로 설명해주세요&#10;• 어떤 도움이 필요한지 명확히 해주세요&#10;• 다른 사람들에게 도움이 될 수 있는 경험을 공유해주세요"
                rows={12}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-300 focus:bg-orange-50 text-gray-800 placeholder-gray-400 resize-none transition-all duration-350 ease-in-out"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.content.length}/2000자
              </p>
            </div>


            {/* 버튼 그룹 */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all duration-250 ease-in-out transform hover:scale-105 font-bold text-2xl"
                disabled={isLoading}
                style={{
                  borderColor: '#cd9f6e',
                  color: '#cd9f6e',
                  background: 'linear-gradient(135deg, #fff 0%, #fff7ed 100%)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #cd9f6e 0%, #e6b88a 100%)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #fff 0%, #fff7ed 100%)';
                  e.currentTarget.style.color = '#cd9f6e';
                }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
                className="flex-1 py-3 text-white rounded transition-all duration-250 ease-in-out transform hover:scale-105 hover:brightness-110 disabled:bg-gray-300 disabled:transform-none disabled:hover:scale-100 disabled:hover:brightness-100 font-bold"
                style={{
                  background: isLoading || !formData.title.trim() || !formData.content.trim() 
                    ? '#D1D5DB' 
                    : 'linear-gradient(135deg, #8B4513 0%, #cd9f6e 100%)'
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isConflictSharingPost ? '공유 중...' : '작성 중...'}
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2 text-2xl">
                    <img src={hedgehogImg} alt="갈등도치" className="relative w-12 h-12 right-5 animate-bounce" />
                    {isConflictSharingPost ? '갈등 상황 공유하기' : '게시글 작성'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 하단 안내 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            게시글 작성 시 <Link to="/community" className="font-bold hover:underline" style={{ color: '#8B4513' }}>커뮤니티 이용규칙</Link>에 동의한 것으로 간주됩니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;