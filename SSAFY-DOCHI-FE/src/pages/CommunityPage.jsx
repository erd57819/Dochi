import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore.js';
import { communityApi, likeApi } from '../services/communityApi.js';
import hedgehogImg from '../assets/conflict.png';
import thumbUp from '@/assets/thumb_up.png';
import thumbDown from '@/assets/thumb_down.png';

const CommunityPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [rankingPosts, setRankingPosts] = useState([]);
  const [rankingType, setRankingType] = useState('views'); // 'views' or 'likes'
  const [rankingLoading, setRankingLoading] = useState(false);

  // 실제 AuthStore 사용
  const { isLoggedIn, user } = useAuthStore();

  const categories = [
    { value: 'ALL', label: '전체', color: '#83673f', gradient: 'linear-gradient(135deg, #83673f 0%, #a58659 100%)' },
    { value: 'CONFLICT_SHARING', label: '찬반투표', color: '#cd9f6e', gradient: 'linear-gradient(135deg, #cd9f6e 0%, #e6b88a 100%)' },
    { value: 'ADVICE_REQUEST', label: '조언해줘', color: '#EE9278', gradient: 'linear-gradient(135deg, #EE9278 0%, #f5a893 100%)' },
    { value: 'SUCCESS_STORIES', label: '해결했어요', color: '#f8d6b3', gradient: 'linear-gradient(135deg, #f8d6b3 0%, #ffe4cc 100%)' },
    { value: 'GENERAL', label: '자유게시판', color: '#7F5539', gradient: 'linear-gradient(135deg, #7F5539 0%, #a06d4d 100%)' },
    { value: 'MY_POSTS', label: '내가 쓴 글', color: '#6B7280', gradient: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)' }
  ];

  // 순위 게시글 조회
  const fetchRankingPosts = async (type = 'views') => {
    try {
      setRankingLoading(true);
      const sortParam = type === 'views' ? 'viewCount' : 'likeCount';
      const data = await communityApi.getPosts(0, 10, '', '', sortParam);
      setRankingPosts(data.content || []);
    } catch (error) {
      console.error('순위 조회 오류:', error);
    } finally {
      setRankingLoading(false);
    }
  };

  // 게시글 목록 조회
  const fetchPosts = async (page = 0, category = '') => {
    try {
      setLoading(true);
      
      if (category === 'MY_POSTS') {
        // 내가 쓴 글 조회
        if (!isLoggedIn || !user) {
          alert('로그인이 필요합니다.');
          setLoading(false);
          return;
        }
        
        // 전체 게시글을 가져와서 내가 쓴 글만 필터링
        // 실제로는 백엔드에서 userId로 필터링하는 API가 있어야 합니다.
        const allData = await communityApi.getPosts(page, 50, '', ''); // 더 많은 데이터를 가져와서 필터링
        const myPosts = (allData.content || []).filter(post => post.userId === user.id);
        
        // 페이지네이션을 위한 계산
        const pageSize = 10;
        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedMyPosts = myPosts.slice(startIndex, endIndex);
        const totalMyPages = Math.ceil(myPosts.length / pageSize);
        
        setPosts(paginatedMyPosts);
        setTotalPages(totalMyPages);
        setCurrentPage(page);
        
        console.log('내가 쓴 글 조회 성공:', {
          totalMyPosts: myPosts.length,
          totalPages: totalMyPages,
          currentPage: page,
          contentLength: paginatedMyPosts.length
        });
      } else {
        // 일반 게시글 조회
        const categoryParam = category === 'ALL' ? '' : category;
        const data = await communityApi.getPosts(page, 10, '', categoryParam);

        setPosts(data.content || []);
        setTotalPages(data.totalPages || 0);
        setCurrentPage(page);

        console.log('게시글 목록 조회 성공:', {
          totalPages: data.totalPages,
          currentPage: page,
          totalElements: data.totalElements,
          contentLength: data.content?.length
        });
      }
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
    fetchRankingPosts(rankingType); // 순위 데이터도 로드
  }, [selectedCategory]);

  // 순위 타입 변경 시 순위 데이터 다시 로드
  useEffect(() => {
    fetchRankingPosts(rankingType);
  }, [rankingType]);

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

  // 작성자 닉네임 또는 이름 표시 함수
  const getDisplayName = (post) => {
    // 삭제된 사용자인 경우
    if (!post.author && !post.authorNickname) {
      return '탈퇴한 회원';
    }
    // 닉네임이 있으면 닉네임을, 없으면 이름을 표시
    return post.authorNickname || post.author || '익명';
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
              <div className="relative w-16 h-16 mx-auto mb-4">
                <img 
                  src={hedgehogImg} 
                  alt="갈등도치" 
                  className="w-16 h-16 animate-spin"
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(139, 69, 19, 0.5))'
                  }}
                />
                <div 
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{
                    background: 'radial-gradient(circle, rgba(139, 69, 19, 0.2) 0%, transparent 70%)'
                  }}
                />
              </div>
              <p 
                className="text-xl font-bold animate-pulse"
                style={{ 
                  background: 'linear-gradient(90deg, #8B4513 0%, #cd9f6e 50%, #8B4513 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                커뮤니티를 불러오는 중...
              </p>
            </div>
          </div>
        </div>
    );
  }

  const selectedCategoryData = categories.find(cat => cat.value === selectedCategory);

  return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        {/* 메인 컨테이너 */}
        <main className="max-w-5xl mx-auto px-3 py-10">

          {/* 상단 인사말 및 글쓰기 버튼 */}
          <div className="flex flex-row items-center justify-between text-3xl font-bold mb-4 py-2 px-6" style={{ color: '#8B4513' }}>
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-4xl font-bold" style={{ color: '#333333' }}>
                  {selectedCategoryData?.label || '전체'} 게시글
                </h3>
                {/* <p className="text-base" style={{ color: '#666666' }}>
                  총 {posts.length} 고슴도치
                </p> */}
              </div>
            </div>

            {/* 글쓰기 버튼 */}
            <div className="">
              {isLoggedIn ? (
                  <Link
                      to="/community/create"
                      className="w-20 h-8 block flex items-center justify-center py-1 rounded hover:opacity-80 transition-all transform hover:bg-orange-50 font-medium text-xs"
                      style={{ 
                        backgroundColor: '#8B4513'
                      }}
                  >
                    <span className='text-white'>글쓰기</span>
                  </Link>
              ) : (
                  <Link
                      to="/login"
                      className="w-32 h-8 block flex items-center justify-center py-1 rounded hover:opacity-80 transition-all transform hover:bg-orange-50 font-medium text-xs"
                      style={{ 
                        backgroundColor: '#696969'
                      }}
                  >
                    <span className='text-white'>로그인하여 글쓰기</span>
                  </Link>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-5" >
            {/* 왼쪽: 카테고리 목록 */}
            <div className="w-1/4">
              <div className="space-y-2 mb-6 bg-white p-2">
                {categories
                  .filter(category => category.value !== 'MY_POSTS' || isLoggedIn) // 로그인된 경우에만 "내가 쓴 글" 표시
                  .map((category) => (
                  <div
                    key={category.value}
                    className={`p-2 rounded cursor-pointer transition-all transform hover:-translate-y-1 ${
                      selectedCategory === category.value ? 'ring-4' : ''
                    }`}
                    style={{
                      background: selectedCategory === category.value ? category.gradient : '#FFFFFF',
                      color: selectedCategory === category.value ? '#FFFFFF' : '#333333',
                      '--ring-color': category.color,
                      '--tw-ring-color': category.color,
                      boxShadow: selectedCategory === category.value ? '0 4px 15px rgba(0, 0, 0, 0.2)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory !== category.value) {
                        e.currentTarget.style.background = category.gradient;
                        e.currentTarget.style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory !== category.value) {
                        e.currentTarget.style.background = '#FFFFFF';
                        e.currentTarget.style.color = '#333333';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                    onClick={() => handleCategoryChange(category.value)}
                  >
                    <div className="flex items-center pl-5 gap-4">
                      <div>
                        <h4 className="font-bold text-base">{category.label}</h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 커뮤니티 순위 */}
              <div className="bg-white p-5 mb-4">
                <h4 className="font-bold text-sm mb-3" style={{ color: '#8B4513' }}>🏆 커뮤니티 순위</h4>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setRankingType('views')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      rankingType === 'views'
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: rankingType === 'views' ? '#8B4513' : undefined
                    }}
                  >
                    조회순
                  </button>
                  <button
                    onClick={() => setRankingType('likes')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      rankingType === 'likes'
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: rankingType === 'likes' ? '#8B4513' : undefined
                    }}
                  >
                    좋아요순
                  </button>
                </div>
                
                {rankingLoading ? (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-500">순위를 불러오는 중...</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rankingPosts.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        순위 데이터가 없습니다
                      </div>
                    ) : (
                      rankingPosts.map((post, index) => {
                        const displayName = getDisplayName(post);
                        return (
                          <div
                            key={post.id}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-all"
                            onClick={() => handlePostClick(post.id)}
                          >
                            <div
                              className={`w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                index < 3 ? 'rounded-full text-white' : 'text-gray-700'
                              }`}
                              style={{
                                background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'transparent',
                                fontSize: '10px'
                              }}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-medium text-gray-800 truncate mb-0.5">
                                {post.title}
                              </h5>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="truncate max-w-[60px]">{displayName}</span>
                                <span>•</span>
                                <span className="text-xs">{rankingType === 'views' ? `조회 ${post.viewCount || 0}` : `좋아요 ${post.likeCount || 0}`}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* 커뮤니티 가이드 */}
              <div className="bg-white p-5">
                <h4 className="font-bold text-sm mb-3" style={{ color: '#8B4513' }}>💡 커뮤니티 가이드</h4>
                <ul className="space-y-2 text-xs" style={{ color: '#666666' }}>
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
            </div>

            {/* 오른쪽: 게시글 목록 */}
            <div className="w-5/7">
              <div className="bg-white min-h-[600px]">

                <div className="space-y-1">
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
                                className="inline-block px-8 py-4 text-white rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 font-medium text-lg"
                                style={{ backgroundColor: '#8B4513' }}
                            >
                              첫 게시글 작성하기
                            </Link>
                        ) : (
                            <Link
                                to="/login"
                                className="inline-block px-8 py-4 rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 font-medium text-lg"
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
                      posts.map(post => {
                        // 게시글의 카테고리에 맞는 색상 찾기
                        const postCategoryData = categories.find(cat => cat.value === post.category) || selectedCategoryData;
                        const displayName = getDisplayName(post);
                        
                        return (
                          <div
                              key={post.id}
                              className="px-5 py-5 cursor-pointer transition-all duration-100 hover:bg-orange-50 rounded-r-lg"
                              onClick={() => handlePostClick(post.id)}
                          >
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div className="flex gap-3 items-start flex-1 min-w-0">
                                <span
                                  className="text-white text-xs px-2 py-1 rounded font-medium flex-shrink-0"
                                  style={{ 
                                    background: postCategoryData?.color || '#8B4513'
                                  }}
                                >
                                  {postCategoryData?.label || post.category}
                                </span>
                                <h4
                                  className="text-xl font-bold transition-colors flex-1 min-w-0 truncate leading-tight"
                                  style={{ color: '#333333' }}
                                >
                                  {post.title}
                                </h4>
                              </div>
                              
                              <div className="flex flex-col items-end gap-1 text-sm flex-shrink-0" style={{ color: '#666666' }}>
                                <span className="whitespace-nowrap">{displayName}</span>
                                <span className="whitespace-nowrap text-xs">{post.createdAt}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-4 text-sm" style={{ color: '#666666' }}>
                                <div className="flex items-center gap-2 text-xs" style={{ color: '#666666' }}>
                                  <span>조회수 {post.viewCount || 0}</span>
                                  <span className="text-gray-400">•</span>
                                  <span>댓글 {post.commentCount || 0}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                    onClick={(e) => handlePostLike(post.id, 'LIKE', e)}
                                    disabled={!isLoggedIn}
                                    className={`flex items-center gap-2 transition-all text-sm font-medium ${
                                        !isLoggedIn
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : post.userLikeType === 'LIKE'
                                                ? 'cursor-pointer'
                                                : 'text-gray-500 cursor-pointer'
                                    }`}
                                    style={{
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      padding: '0',
                                      color: !isLoggedIn 
                                        ? '#d1d5db' 
                                        : post.userLikeType === 'LIKE' 
                                          ? 'rgba(255,177,32,1)' 
                                          : '#6b7280'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (isLoggedIn && post.userLikeType !== 'LIKE') {
                                        e.currentTarget.style.color = 'rgba(255,177,32,0.7)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (isLoggedIn && post.userLikeType !== 'LIKE') {
                                        e.currentTarget.style.color = '#6b7280';
                                      }
                                    }}
                                >
                                  <img src={thumbUp} alt="따봉" className="w-6 h-6" /> {post.likeCount || 0}
                                </button>
                                <button
                                    onClick={(e) => handlePostLike(post.id, 'DISLIKE', e)}
                                    disabled={!isLoggedIn}
                                    className={`flex items-center gap-2 transition-all text-sm font-medium ${
                                        !isLoggedIn
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : post.userLikeType === 'DISLIKE'
                                                ? 'cursor-pointer'
                                                : 'text-gray-500 cursor-pointer'
                                    }`}
                                    style={{
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      padding: '0',
                                      color: !isLoggedIn 
                                        ? '#d1d5db' 
                                        : post.userLikeType === 'DISLIKE' 
                                          ? 'rgba(191,125,44,1)' 
                                          : '#6b7280'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (isLoggedIn && post.userLikeType !== 'DISLIKE') {
                                        e.currentTarget.style.color = 'rgba(191,125,44,0.7)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (isLoggedIn && post.userLikeType !== 'DISLIKE') {
                                        e.currentTarget.style.color = '#6b7280';
                                      }
                                    }}
                                >
                                  <img src={thumbDown} alt="안따봉" className="w-6 h-6" /> {post.dislikeCount || 0}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 0 && (
                    <div className="flex justify-between pt-6 px-5 pb-5">
                      <button
                          onClick={() => currentPage > 0 && handlePageChange(currentPage - 1)}
                          disabled={currentPage === 0}
                          className="px-3 py-1 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 hover:text-gray-800"
                      >
                        이전 페이지
                      </button>

                      <div className="flex items-center gap-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const startPage = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
                          const pageNum = startPage + i;
                          if (pageNum >= totalPages) return null;
                          return (
                              <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`w-8 h-8 rounded-lg font-medium transition-all text-sm ${
                                      currentPage === pageNum ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-800'
                                  }`}
                              >
                                {pageNum + 1}
                              </button>
                          );
                        })}
                      </div>

                      <button
                          onClick={() => currentPage < totalPages - 1 && handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages - 1}
                          className="px-3 py-1 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 hover:text-gray-800"
                      >
                        다음 페이지
                      </button>
                    </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* 글쓰기 플로팅 버튼 (모바일) */}
        {isLoggedIn && (
            <Link
                to="/community/create"
                className="lg:hidden fixed bottom-6 right-6 w-14 h-14 text-white rounded-full flex items-center justify-center text-2xl hover:opacity-90 transition-all z-10"
                style={{ backgroundColor: '#8B4513' }}
            >
              ✍️
            </Link>
        )}
      </div>
  );
};
  
export default CommunityPage;