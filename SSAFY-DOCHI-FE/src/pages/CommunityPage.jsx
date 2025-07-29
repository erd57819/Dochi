import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore';
import { communityApi, likeApi } from '../services/communityApi';
import CreatePostModal from '../components/CreatePostModal';
import PostDetailModal from '../components/PostDetailModal';

const CommunityPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // 실제 AuthStore 사용
  const { isLoggedIn, user } = useAuthStore();

  const categories = [
    { value: 'ALL', label: '전체' },
    { value: 'CONFLICT_SHARING', label: '갈등공유' },
    { value: 'SUCCESS_STORIES', label: '성공사례' },
    { value: 'ADVICE_REQUEST', label: '조언요청' },
    { value: 'GENERAL', label: '자유게시판' }
  ];

  // 게시글 목록 조회
  const fetchPosts = async (page = 0, category = '') => {
    try {
      setLoading(true);
      const categoryParam = category === 'ALL' ? '' : category;
      const data = await communityApi.getPosts(page, 10, '', categoryParam);
      
      setPosts(data.content || []);
      setTotalPages(data.totalPages || 0);
      setCurrentPage(page);
      
      console.log('게시글 목록 조회 성공:', data);
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error);
      alert('게시글 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchPosts(0, selectedCategory);
  }, [selectedCategory]);

  // 카테고리 변경
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(0);
  };

  // 게시글 좋아요 토글
  const handlePostLike = async (postId, likeType, e) => {
    e.stopPropagation(); // 게시글 클릭 이벤트 방지
    
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const result = await likeApi.togglePostLike(postId, likeType);
      
      // 게시글 목록에서 해당 게시글의 좋아요 정보 업데이트
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? {
                ...post,
                likeCount: result.likeCount,
                dislikeCount: result.dislikeCount,
                userLikeType: result.userLikeType
              }
            : post
        )
      );

      console.log('게시글 좋아요 처리 성공:', result);
    } catch (error) {
      console.error('게시글 좋아요 처리 실패:', error);
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  // 게시글 클릭 시 상세보기
  const handlePostClick = (postId) => {
    setSelectedPostId(postId);
    setIsDetailModalOpen(true);
  };

  // 게시글 작성 완료 후 목록 새로고침
  const handlePostCreated = () => {
    fetchPosts(currentPage, selectedCategory);
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    fetchPosts(page, selectedCategory);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🦔</div>
          <p className="text-gray-600">커뮤니티를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">갈등도치 커뮤니티</h1>
              <p className="text-gray-600">갈등 해결 경험과 조언을 나누어요</p>
              {/* 로그인 상태 표시 */}
              {isLoggedIn && user && (
                <p className="text-sm text-orange-600 mt-1">
                  {user.name || user.email}님 환영합니다!
                </p>
              )}
            </div>
            {isLoggedIn ? (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                글쓰기
              </button>
            ) : (
              <Link 
                to="/login"
                className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                로그인하여 글쓰기
              </Link>
            )}
          </div>
        </div>

        {/* 나머지 코드는 동일... */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 사이드바 - 카테고리 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h3 className="font-semibold text-gray-800 mb-3">카테고리</h3>
              <div className="space-y-1">
                {categories.map(category => (
                  <button
                    key={category.value}
                    onClick={() => handleCategoryChange(category.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === category.value
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <p className="text-gray-600">해당 카테고리의 게시글이 없습니다.</p>
                  {!isLoggedIn && (
                    <div className="mt-4">
                      <Link 
                        to="/login"
                        className="text-orange-500 hover:text-orange-600"
                      >
                        로그인하고 첫 게시글을 작성해보세요!
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                posts.map(post => (
                  <div 
                    key={post.id} 
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handlePostClick(post.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                          {categories.find(cat => cat.value === post.category)?.label || post.category}
                        </span>
                        <span className="text-xs text-gray-500">{post.author || '익명'}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{post.createdAt}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-orange-500">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {post.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>👁 {post.viewCount || 0}</span>
                        <span>💬 {post.commentCount || 0}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => handlePostLike(post.id, 'LIKE', e)}
                          disabled={!isLoggedIn}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                            !isLoggedIn 
                              ? 'text-gray-300 cursor-not-allowed'
                              : post.userLikeType === 'LIKE'
                              ? 'bg-orange-100 text-orange-600'
                              : 'text-gray-400 hover:text-orange-500'
                          }`}
                        >
                          👍 {post.likeCount || 0}
                        </button>
                        <button 
                          onClick={(e) => handlePostLike(post.id, 'DISLIKE', e)}
                          disabled={!isLoggedIn}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                            !isLoggedIn 
                              ? 'text-gray-300 cursor-not-allowed'
                              : post.userLikeType === 'DISLIKE'
                              ? 'bg-red-100 text-red-600'
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                        >
                          👎 {post.dislikeCount || 0}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                  >
                    ←
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`px-3 py-2 rounded ${
                        currentPage === i
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 게시글 작성 모달 */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

      {/* 게시글 상세보기 모달 */}
      <PostDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        postId={selectedPostId}
      />
    </div>
  );
};

export default CommunityPage;