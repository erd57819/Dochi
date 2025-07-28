import React, { useState, useEffect } from 'react';

const NoticePage = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // TODO: 백엔드 API 연동
  useEffect(() => {
    // 임시 데이터
    const mockNotices = [
      {
        id: 1,
        title: '참견도치 서비스 오픈 안내',
        content: '안녕하세요. 참견도치 서비스가 정식으로 오픈되었습니다.',
        category: 'ANNOUNCEMENT',
        isImportant: true,
        viewCount: 150,
        createdAt: '2024-01-15',
        publishDate: '2024-01-15'
      },
      {
        id: 2,
        title: '시스템 점검 안내',
        content: '서버 점검으로 인한 서비스 일시 중단 안내입니다.',
        category: 'MAINTENANCE',
        isImportant: false,
        viewCount: 89,
        createdAt: '2024-01-10',
        publishDate: '2024-01-10'
      }
    ];
    
    setTimeout(() => {
      setNotices(mockNotices);
      setLoading(false);
    }, 1000);
  }, []);

  const categories = [
    { value: 'ALL', label: '전체' },
    { value: 'ANNOUNCEMENT', label: '공지사항' },
    { value: 'SYSTEM', label: '시스템' },
    { value: 'UPDATE', label: '업데이트' },
    { value: 'MAINTENANCE', label: '점검' }
  ];

  const filteredNotices = selectedCategory === 'ALL' 
    ? notices 
    : notices.filter(notice => notice.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🦔</div>
          <p className="text-gray-600">공지사항을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">공지사항</h1>
          <p className="text-gray-600">참견도치의 새로운 소식을 확인해보세요</p>
        </div>

        {/* 카테고리 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* 공지사항 목록 */}
        <div className="space-y-4">
          {filteredNotices.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-gray-600">해당 카테고리의 공지사항이 없습니다.</p>
            </div>
          ) : (
            filteredNotices.map(notice => (
              <div key={notice.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {notice.isImportant && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          중요
                        </span>
                      )}
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                        {categories.find(cat => cat.value === notice.category)?.label}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-orange-500">
                      {notice.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {notice.content}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>조회 {notice.viewCount}</span>
                      <span>{notice.publishDate}</span>
                    </div>
                  </div>
                  
                  <div className="text-gray-400 ml-4">
                    →
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticePage;