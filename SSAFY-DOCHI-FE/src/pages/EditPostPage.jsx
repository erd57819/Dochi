import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { communityApi } from '../services/communityApi.js';
import useAuthStore from '../stores/AuthStore.js';

const EditPostPage = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const { isLoggedIn, user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalPost, setOriginalPost] = useState(null);

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

  // 게시글 데이터 로드
  useEffect(() => {
    const loadPost = async () => {
      try {
        const post = await communityApi.getPost(postId);
        
        // 작성자 권한 확인
        if (post.userId !== user.id && user.role !== 'ADMIN') {
          alert('이 게시글을 수정할 권한이 없습니다.');
          navigate('/community');
          return;
        }
        
        setOriginalPost(post);
        setFormData({
          title: post.title || '',
          content: post.content || '',
          category: post.category || 'GENERAL'
        });
      } catch (error) {
        console.error('게시글 로드 실패:', error);
        alert('게시글을 불러올 수 없습니다.');
        navigate('/community');
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      loadPost();
    }
  }, [postId, user, navigate]);

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

    setIsSubmitting(true);
    
    try {
      await communityApi.updatePost(postId, formData);
      alert('게시글이 성공적으로 수정되었습니다!');
      navigate(`/community/post/${postId}`);
    } catch (error) {
      alert('게시글 수정에 실패했습니다: ' + error.message);
      console.error('게시글 수정 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🦔</div>
            <p className="text-gray-600">게시글을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <span className="text-2xl">✏️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">게시글 수정</h1>
            <p className="text-gray-600">게시글 내용을 수정해보세요</p>
            <p className="text-sm text-blue-600 mt-2">
              작성자: {user?.nickname || user?.name || user?.email}님
            </p>
          </div>
        </div>

        {/* 수정 안내 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl">💡</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">게시글 수정 안내</h3>
              <ul className="text-blue-700 space-y-1 text-sm">
                <li>• 수정된 내용은 즉시 다른 사용자들에게 표시됩니다</li>
                <li>• 개인정보나 실명은 절대 포함하지 마세요</li>
                <li>• 커뮤니티 이용규칙을 준수해주세요</li>
                <li>• 수정 후에는 되돌릴 수 없습니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 수정 폼 */}
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
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
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
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400"
                disabled={isSubmitting}
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
                placeholder="게시글 내용을 입력하세요"
                rows={12}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 resize-none"
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.content.length}/2000자
              </p>
            </div>

            {/* 수정 가이드 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">
                💡 게시글 수정 시 주의사항
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 수정된 내용은 즉시 반영되며 되돌릴 수 없습니다</li>
                <li>• 다른 사용자들이 이미 작성한 댓글은 유지됩니다</li>
                <li>• 커뮤니티 이용규칙을 위반하는 내용은 삭제될 수 있습니다</li>
                <li>• 개인정보나 실명은 절대 포함하지 마세요</li>
              </ul>
            </div>

            {/* 버튼 그룹 */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate(`/community/post/${postId}`)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
                className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors font-medium"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    수정 중...
                  </div>
                ) : (
                  '게시글 수정'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 하단 안내 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            게시글 수정 시 <span className="text-blue-600 font-medium">커뮤니티 이용규칙</span>에 동의한 것으로 간주됩니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditPostPage;