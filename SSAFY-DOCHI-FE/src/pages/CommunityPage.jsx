import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore.js';
import { communityApi, likeApi } from '../services/communityApi.js';
import hedgehogImg from '../assets/conflict.png';

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
    { value: 'ALL', label: '전체', color: '#83673f' },
    { value: 'CONFLICT_SHARING', label: '갈등공유', color: '#cd9f6e' },
    { value: 'SUCCESS_STORIES', label: '성공사례', color: '#f8d6b3' },
    { value: 'ADVICE_REQUEST', label: '조언요청', color: '#EE9278' },
    { value: 'GENERAL', label: '자유게시판', color: '#7F5539' }
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

    // 🔍 디버깅 로그 추가
    console.log('=== 좋아요 디버깅 ===');
    console.log('user 객체 전체:', user);
    console.log('user.id:', user?.id);
    console.log('user.userId:', user?.userId);
    console.log('postId:', postId);
    console.log('likeType:', likeType);
    console.log('====================');

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
        <div className="min-h-screen relative">
          {/* 배경 */}
          <div className="absolute inset-0">
            <div
                className="absolute top-0 left-0 w-full"
                style={{
                  height: '100%',
                  background: 'linear-gradient(to bottom, rgb(248, 214, 179), white)',
                  opacity: 0.14
                }}
            ></div>
          </div>

          <div className="relative z-10 flex items-center justify-center min-h-screen">
            <div className="text-center">
              <img src={hedgehogImg} alt="갈등도치" className="w-16 h-16 mx-auto mb-4 animate-bounce" />
              <p className="text-xl" style={{ color: '#8B4513' }}>커뮤니티를 불러오는 중...</p>
            </div>
          </div>
        </div>
    );
  }

  const selectedCategoryData = categories.find(cat => cat.value === selectedCategory);

  return (
      <div className="min-h-screen relative">
        {/* 전체 배경 컨테이너 */}
        <div className="absolute inset-0">
          {/* 상단 배경 */}
          <div
              className="absolute top-0 left-0 w-full"
              style={{
                height: '100%',
                background: 'linear-gradient(to bottom, rgb(248, 214, 179), rgba(255, 207, 159, 1))',
                opacity: 0.14
              }}
          ></div>

          {/* 하단 배경 */}
          <div
              className="absolute bottom-0 left-0 w-full"
              style={{
                // height: '50%',
                backgroundColor: '#FFFFFF'
              }}
          ></div>
        </div>

        {/* 메인 컨텐츠 */}
        <main className="max-w-6xl mx-auto px-4 py-12 relative z-10">

          {/* 상단 메시지 */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{
              background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              갈등 해결 경험과 조언을 나누는 공간
            </h2>
            <p className="text-xl" style={{ color: '#666666' }}>
              함께 소통하며 더 나은 관계를 만들어가요
            </p>
          </div>


          <div className="flex flex-wrap justify-between gap-6" >
            {/* 왼쪽: 카테고리 목록 */}
            <div className="w-1/4">
              <div className="space-y-3 mb-8">
                {categories.map((category) => (
                    <div
                        key={category.value}
                        className={`p-2 rounded-2xl cursor-pointer transition-all transform hover:-translate-y-1 shadow-lg ${
                            selectedCategory === category.value ? 'ring-4 ring-opacity-50' : ''
                        }`}
                        style={{
                          backgroundColor: selectedCategory === category.value ? category.color : '#FFFFFF',
                          color: selectedCategory === category.value ? '#FFFFFF' : '#333333',
                          ringColor: category.color
                        }}
                        onClick={() => handleCategoryChange(category.value)}
                    >
                      <div className="flex items-center gap-4">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                            style={{
                              backgroundColor: selectedCategory === category.value ? 'rgba(255,255,255,0.2)' : category.color,
                              color: '#FFFFFF'
                            }}
                        >
                          📂
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{category.label}</h4>
                        </div>
                      </div>
                    </div>
                ))}
              </div>

              {/* 커뮤니티 가이드 */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h4 className="font-bold text-xl mb-4" style={{ color: '#8B4513' }}>💡 커뮤니티 가이드</h4>
                <ul className="space-y-3" style={{ color: '#666666' }}>
                  <li className="flex items-center gap-2">
                    <span style={{ color: '#BF7D2C' }}>•</span>
                    서로 존중하는 대화
                  </li>
                  <li className="flex items-center gap-2">
                    <span style={{ color: '#BF7D2C' }}>•</span>
                    건설적인 조언 나누기
                  </li>
                  <li className="flex items-center gap-2">
                    <span style={{ color: '#BF7D2C' }}>•</span>
                    개인정보 보호하기
                  </li>
                  <li className="flex items-center gap-2">
                    <span style={{ color: '#BF7D2C' }}>•</span>
                    긍정적인 해결책 제시
                  </li>
                </ul>
              </div>

              {/* 글쓰기 버튼 */}
              <div className="mt-6">
                {isLoggedIn ? (
                    <Link
                        to="/community/create"
                        className="w-full block text-center py-4 text-white rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 shadow-lg font-medium text-lg"
                        style={{ backgroundColor: '#8B4513' }}
                    >
                      ✍️ 새 글 작성하기
                    </Link>
                ) : (
                    <Link
                        to="/login"
                        className="w-full block text-center py-4 text-white rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 shadow-lg font-medium text-lg"
                        style={{ backgroundColor: '#696969' }}
                    >
                      로그인하여 글쓰기
                    </Link>
                )}
              </div>
            </div>

            {/* 오른쪽: 게시글 목록 */}
            <div className="w-5/7">
              <div className="bg-white rounded-3xl p-8 shadow-xl min-h-[600px]">
                <div className="flex items-center gap-4 mb-6">
                  <div
                      className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl text-white"
                      style={{ backgroundColor: selectedCategoryData?.color || '#8B4513' }}
                  >
                    📝
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold" style={{ color: '#333333' }}>
                      {selectedCategoryData?.label || '전체'} 게시글
                    </h3>
                    <p className="text-lg" style={{ color: '#666666' }}>
                      총 {posts.length}개의 게시글
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {posts.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="text-6xl mb-6">📝</div>
                        <h4 className="text-2xl font-bold mb-4" style={{ color: '#333333' }}>
                          해당 카테고리의 게시글이 없습니다
                        </h4>
                        <p className="text-lg mb-8" style={{ color: '#666666' }}>
                          첫 번째 게시글을 작성해보세요!
                        </p>
                        {isLoggedIn ? (
                            <Link
                                to="/community/create"
                                className="inline-block px-8 py-4 text-white rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 shadow-lg font-medium text-lg"
                                style={{ backgroundColor: '#8B4513' }}
                            >
                              첫 게시글 작성하기
                            </Link>
                        ) : (
                            <Link
                                to="/login"
                                className="inline-block px-8 py-4 rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 shadow-lg font-medium text-lg"
                                style={{
                                  backgroundColor: '#F8D6B3',
                                  color: '#8B4513'
                                }}
                            >
                              로그인하고 첫 게시글을 작성해보세요! →
                            </Link>
                        )}
                      </div>
                  ) : (
                      posts.map(post => (
                          <div
                              key={post.id}
                              className="border-l-4 pl-6 py-4 cursor-pointer transition-all hover:bg-gray-50 rounded-r-lg"
                              style={{ borderColor: selectedCategoryData?.color || '#8B4513' }}
                              onClick={() => handlePostClick(post.id)}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                          <span
                              className="text-xs px-3 py-1 rounded-full font-medium text-white"
                              style={{ backgroundColor: selectedCategoryData?.color || '#8B4513' }}
                          >
                            {categories.find(cat => cat.value === post.category)?.label || post.category}
                          </span>
                                <div className="flex items-center gap-2 text-sm" style={{ color: '#666666' }}>
                                  <div
                                      className="w-6 h-6 rounded-full flex items-center justify-center"
                                      style={{ backgroundColor: '#F8D6B3' }}
                                  >
                              <span className="text-xs font-medium" style={{ color: '#8B4513' }}>
                                {(post.author || '익명').charAt(0)}
                              </span>
                                  </div>
                                  <span className="font-medium">{post.author || '익명'}</span>
                                  <span className="text-gray-400">•</span>
                                  <span>{post.createdAt}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-xs" style={{ color: '#666666' }}>
                                <span>👁</span>
                                <span>{post.viewCount || 0}</span>
                              </div>
                            </div>

                            <h4 className="text-xl font-bold mb-3 hover:opacity-70 transition-colors" style={{ color: '#333333' }}>
                              {post.title}
                            </h4>

                            <p className="text-lg mb-4 leading-relaxed line-clamp-2" style={{ color: '#666666' }}>
                              {post.content}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm" style={{ color: '#666666' }}>
                                <div className="flex items-center gap-1">
                                  <span>💬</span>
                                  <span>{post.commentCount || 0}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => handlePostLike(post.id, 'LIKE', e)}
                                    disabled={!isLoggedIn}
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${
                                        !isLoggedIn
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : post.userLikeType === 'LIKE'
                                                ? 'text-white shadow-lg'
                                                : 'hover:opacity-70'
                                    }`}
                                    style={{
                                      backgroundColor: !isLoggedIn
                                          ? 'transparent'
                                          : post.userLikeType === 'LIKE'
                                              ? '#BF7D2C'
                                              : '#F8D6B3',
                                      color: !isLoggedIn
                                          ? '#cccccc'
                                          : post.userLikeType === 'LIKE'
                                              ? '#FFFFFF'
                                              : '#8B4513'
                                    }}
                                >
                                  👍 {post.likeCount || 0}
                                </button>
                                <button
                                    onClick={(e) => handlePostLike(post.id, 'DISLIKE', e)}
                                    disabled={!isLoggedIn}
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${
                                        !isLoggedIn
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : post.userLikeType === 'DISLIKE'
                                                ? 'text-white shadow-lg'
                                                : 'hover:opacity-70'
                                    }`}
                                    style={{
                                      backgroundColor: !isLoggedIn
                                          ? 'transparent'
                                          : post.userLikeType === 'DISLIKE'
                                              ? '#7F5539'
                                              : '#F0F0F0',
                                      color: !isLoggedIn
                                          ? '#cccccc'
                                          : post.userLikeType === 'DISLIKE'
                                              ? '#FFFFFF'
                                              : '#666666'
                                    }}
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
                    <div className="flex justify-between pt-8">
                      <button
                          onClick={() => currentPage > 0 && handlePageChange(currentPage - 1)}
                          disabled={currentPage === 0}
                          className="px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: currentPage === 0 ? '#E5E5E5' : '#696969',
                            color: '#FFFFFF'
                          }}
                      >
                        이전 페이지
                      </button>

                      <div className="flex items-center gap-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i;
                          return (
                              <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`w-10 h-10 rounded-lg font-medium transition-all ${
                                      currentPage === pageNum ? 'text-white shadow-lg' : 'hover:opacity-70'
                                  }`}
                                  style={{
                                    backgroundColor: currentPage === pageNum
                                        ? (selectedCategoryData?.color || '#8B4513')
                                        : '#F0F0F0',
                                    color: currentPage === pageNum ? '#FFFFFF' : '#666666'
                                  }}
                              >
                                {pageNum + 1}
                              </button>
                          );
                        })}
                      </div>

                      <button
                          onClick={() => currentPage < totalPages - 1 && handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages - 1}
                          className="px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: currentPage === totalPages - 1 ? '#E5E5E5' : (selectedCategoryData?.color || '#8B4513'),
                            color: '#FFFFFF'
                          }}
                      >
                        다음 페이지
                      </button>
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* 하단 액션 버튼 */}
          <div className="text-center mt-12">
            <Link
                to="/roadmap"
                className="px-8 py-4 text-white rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 shadow-lg font-medium text-lg mr-4"
                style={{ backgroundColor: '#8B4513' }}
            >
              갈등 해결 로드맵 보기
            </Link>
            {isLoggedIn && (
                <Link
                    to="/conflicts/create"
                    className="px-8 py-4 rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 shadow-lg font-medium text-lg"
                    style={{
                      backgroundColor: '#F8D6B3',
                      color: '#8B4513'
                    }}
                >
                  내 갈등 상황 분석해보기
                </Link>
            )}
          </div>
        </main>

        {/* 글쓰기 플로팅 버튼 (모바일) */}
        {isLoggedIn && (
            <Link
                to="/community/create"
                className="lg:hidden fixed bottom-6 right-6 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:opacity-90 transition-all z-10"
                style={{ backgroundColor: '#8B4513' }}
            >
              ✍️
            </Link>
        )}
      </div>
  );
};

export default CommunityPage;