import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore';

const CommunityPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const { isLoggedIn } = useAuthStore();

  // TODO: 백엔드 API 연동
  useEffect(() => {
    // 임시 데이터
    const mockPosts = [
      {
        id: 1,
        title: '직장에서 동료와의 갈등 어떻게 해결하셨나요?',
        content: '팀 프로젝트를 하면서 의견 차이로 갈등이 생겼는데...',
        category: 'ADVICE_REQUEST',
        author: '갈등해결러',
        viewCount: 245,
        commentCount: 12,
        createdAt: '2024-01-15',
        tags: ['직장', '동료', '의견충돌']
      },
      {
        id: 2,
        title: '참견도치 덕분에 가족관계가 좋아졌어요!',
        content: '어머니와의 갈등이 오래 지속되었는데 참견도치 서비스를 통해...',
        category: 'SUCCESS_STORIES',
        author: '행복한딸',
        viewCount: 189,
        commentCount: 8,
        createdAt: '2024-01-14',
        tags: ['가족', '성공사례', '감사']
      },
      {
        id: 3,
        title: '친구와의 오해로 생긴 갈등 공유합니다',
        content: '작은 오해에서 시작된 갈등이 점점 커져서...',
        category: 'CONFLICT_SHARING',
        author: '우정지킴이',
        viewCount: 156,
        commentCount: 15,
        createdAt: '2024-01-13',
        tags: ['친구', '오해', '우정']
      }
    ];
    
    setTimeout(() => {
      setPosts(mockPosts);
      setLoading(false);
    }, 1000);
  }, []);

  const categories = [
    { value: 'ALL', label: '전체' },
    { value: 'CONFLICT_SHARING', label: '갈등공유' },
    { value: 'SUCCESS_STORIES', label: '성공사례' },
    { value: 'ADVICE_REQUEST', label: '조언요청' },
    { value: 'GENERAL', label: '자유게시판' }
  ];

  const filteredPosts = selectedCategory === 'ALL' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

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
            </div>
            {isLoggedIn && (
              <button className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors">
                글쓰기
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 사이드바 - 카테고리 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h3 className="font-semibold text-gray-800 mb-3">카테고리</h3>
              <div className="space-y-1">
                {categories.map(category => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
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
              {filteredPosts.length === 0 ? (
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
                filteredPosts.map(post => (
                  <div key={post.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                          {categories.find(cat => cat.value === post.category)?.label}
                        </span>
                        <span className="text-xs text-gray-500">{post.author}</span>
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

                    {/* 태그 */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>👁 {post.viewCount}</span>
                        <span>💬 {post.commentCount}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button className="text-gray-400 hover:text-orange-500 transition-colors">
                          👍
                        </button>
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                          👎
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 페이지네이션 */}
            {filteredPosts.length > 0 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <button className="px-3 py-2 text-gray-500 hover:text-gray-700">←</button>
                  <button className="px-3 py-2 bg-orange-500 text-white rounded">1</button>
                  <button className="px-3 py-2 text-gray-500 hover:text-gray-700">2</button>
                  <button className="px-3 py-2 text-gray-500 hover:text-gray-700">3</button>
                  <button className="px-3 py-2 text-gray-500 hover:text-gray-700">→</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;