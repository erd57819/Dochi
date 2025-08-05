import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore.js';
import { communityApi, likeApi } from '../services/communityApi.js';

const CommunityPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
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
      const result = await likeApi.togglePostLike(postId, user.id, likeType);
      
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
      alert(error.message || '좋아요 처리에 실패했습니다.');
    }
  };

  // 게시글 클릭 시 상세보기 페이지로 이동
  const handlePostClick = (postId) => {
    navigate(`/community/post/${postId}`);
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
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">갈등도치 커뮤니티</h1>
              </div>
              <p className="text-gray-600">갈등 해결 경험과 조언을 나누어요</p>
              {/* 로그인 상태 표시 */}
              {isLoggedIn && user && (
                <p className="text-sm text-orange-600 mt-2">
                  <span className="font-semibold">{user.nickname || user.name || user.email}</span>도치님 환영합니다! 🦔
                </p>
              )}
            </div>
            {isLoggedIn ? (
              <Link 
                to="/community/create"
                className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <span className="text-lg">✍️</span>
                글쓰기
              </Link>
            ) : (
              <div className="text-center">
                <Link 
                  to="/login"
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors block mb-2"
                >
                  로그인하여 글쓰기
                </Link>
                <p className="text-xs text-gray-500">로그인 후 참여하세요</p>
              </div>
            )}
          </div>
        </div>

        {/* 통계 및 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">{posts.length}</div>
            <div className="text-sm text-gray-600">오늘의 게시글</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">156</div>
            <div className="text-sm text-gray-600">활성 사용자</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-500">89%</div>
            <div className="text-sm text-gray-600">해결률</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 사이드바 - 카테고리 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-lg">📂</span>
                카테고리
              </h3>
              <div className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category.value}
                    onClick={() => handleCategoryChange(category.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all ${
                      selectedCategory === category.value
                        ? 'bg-orange-500 text-white shadow-md transform scale-105'
                        : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              
              {/* 커뮤니티 가이드 */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">💡 커뮤니티 가이드</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 서로 존중하는 대화</li>
                  <li>• 건설적인 조언 나누기</li>
                  <li>• 개인정보 보호하기</li>
                  <li>• 긍정적인 해결책 제시</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    해당 카테고리의 게시글이 없습니다
                  </h3>
                  <p className="text-gray-600 mb-6">
                    첫 번째 게시글을 작성해보세요!
                  </p>
                  {isLoggedIn ? (
                    <Link 
                      to="/community/create"
                      className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                    >
                      첫 게시글 작성하기
                    </Link>
                  ) : (
                    <Link 
                      to="/login"
                      className="inline-block text-orange-500 hover:text-orange-600 font-medium"
                    >
                      로그인하고 첫 게시글을 작성해보세요! →
                    </Link>
                  )}
                </div>
              ) : (
                posts.map(post => (
                  <div 
                    key={post.id} 
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                    onClick={() => handlePostClick(post.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-medium">
                          {categories.find(cat => cat.value === post.category)?.label || post.category}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-orange-600">
                              {(post.author || '익명').charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium">{post.author || '익명'}</span>
                          <span className="text-gray-400">•</span>
                          <span>{post.createdAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>👁</span>
                        <span>{post.viewCount || 0}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 hover:text-orange-500 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {post.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <span>💬</span>
                          <span>{post.commentCount || 0}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => handlePostLike(post.id, 'LIKE', e)}
                          disabled={!isLoggedIn}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-all ${
                            !isLoggedIn 
                              ? 'text-gray-300 cursor-not-allowed'
                              : post.userLikeType === 'LIKE'
                              ? 'bg-orange-100 text-orange-600 shadow-sm'
                              : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'
                          }`}
                        >
                          👍 {post.likeCount || 0}
                        </button>
                        <button 
                          onClick={(e) => handlePostLike(post.id, 'DISLIKE', e)}
                          disabled={!isLoggedIn}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-all ${
                            !isLoggedIn 
                              ? 'text-gray-300 cursor-not-allowed'
                              : post.userLikeType === 'DISLIKE'
                              ? 'bg-red-100 text-red-600 shadow-sm'
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
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
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-orange-500 disabled:text-gray-300 transition-colors"
                  >
                    ←
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                        currentPage === i
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-orange-500 disabled:text-gray-300 transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>
            )}

            {/* 글쓰기 플로팅 버튼 (모바일) */}
            {isLoggedIn && (
              <Link
                to="/community/create"
                className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-orange-600 transition-all z-10"
              >
                ✍️
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;