import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { communityApi } from '../services/communityApi.js';
import useAuthStore from '../stores/AuthStore.js';

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
    { value: 'GENERAL', label: '자유게시판' },
    { value: 'CONFLICT_SHARING', label: '갈등공유' },
    { value: 'SUCCESS_STORIES', label: '성공사례' },
    { value: 'ADVICE_REQUEST', label: '조언요청' }
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              isConflictSharingPost ? 'bg-blue-100' : 'bg-orange-100'
            }`}>
              <span className="text-2xl">{isConflictSharingPost ? '📢' : '✍️'}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {isConflictSharingPost ? '갈등 상황 공유하기' : '새 게시글 작성'}
            </h1>
            <p className="text-gray-600">
              {isConflictSharingPost 
                ? '갈등 상황을 공유하고 커뮤니티의 조언을 구해보세요' 
                : '갈등 해결 경험과 조언을 커뮤니티와 나누어보세요'
              }
            </p>
            {/* 작성자 정보 */}
            <p className="text-sm text-orange-600 mt-2">
              작성자: {user?.nickname || user?.name || user?.email}님
            </p>
          </div>
        </div>

        {/* 갈등 공유 안내 */}
        {isConflictSharingPost && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl">💡</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">갈등 공유 게시글 안내</h3>
                <ul className="text-blue-700 space-y-1 text-sm">
                  <li>• 개인정보나 실명은 절대 포함하지 마세요</li>
                  <li>• 객관적이고 균형잡힌 시각으로 상황을 설명해주세요</li>
                  <li>• 커뮤니티의 건설적인 조언을 기대할 수 있어요</li>
                  <li>• A안/B안 형태의 투표로 다양한 의견을 수집할 수 있습니다</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 작성 폼 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
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
                    className={`cursor-pointer p-3 rounded-lg border-2 text-center transition-all ${
                      formData.category === category.value
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.value}
                      checked={formData.category === category.value}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <div className="font-medium text-sm">{category.label}</div>
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
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400 resize-none"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.content.length}/2000자
              </p>
            </div>

            {/* 작성 가이드 */}
            <div className={`border rounded-lg p-4 ${
              isConflictSharingPost 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <h3 className="text-sm font-semibold text-blue-800 mb-2">
                💡 {isConflictSharingPost ? '갈등 공유 게시글 작성 팁' : '좋은 게시글 작성 팁'}
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                {isConflictSharingPost ? (
                  <>
                    <li>• 실명이나 구체적인 회사명 등 개인정보는 절대 포함하지 마세요</li>
                    <li>• 객관적이고 균형잡힌 시각으로 상황을 설명해주세요</li>
                    <li>• A안/B안 형태로 선택지를 제시하면 더 많은 의견을 받을 수 있어요</li>
                    <li>• 감정적인 표현보다는 사실 중심으로 작성해주세요</li>
                  </>
                ) : (
                  <>
                    <li>• 구체적이고 명확한 제목을 작성해주세요</li>
                    <li>• 상황을 자세히 설명하면 더 정확한 조언을 받을 수 있어요</li>
                    <li>• 다른 사람을 비방하거나 개인정보를 노출하지 마세요</li>
                    <li>• 긍정적이고 건설적인 내용으로 작성해주세요</li>
                  </>
                )}
              </ul>
            </div>

            {/* 버튼 그룹 */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (formData.title.trim() || formData.content.trim()) {
                    const confirmed = confirm('작성 중인 내용이 있습니다. 임시저장하시겠습니까?');
                    if (confirmed) {
                      localStorage.setItem('draftPost', JSON.stringify(formData));
                      alert('임시저장되었습니다.');
                    }
                  }
                }}
                className="px-6 py-3 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium"
                disabled={isLoading}
              >
                임시저장
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
                className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 transition-colors font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isConflictSharingPost ? '공유 중...' : '작성 중...'}
                  </div>
                ) : (
                  isConflictSharingPost ? '갈등 상황 공유하기' : '게시글 작성'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 하단 안내 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            게시글 작성 시 <span className="text-orange-600 font-medium">커뮤니티 이용규칙</span>에 동의한 것으로 간주됩니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;