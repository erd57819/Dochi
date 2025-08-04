import React, { useState, useEffect } from 'react';
import { noticeApi } from '../services/noticeApi';

const NoticePage = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [error, setError] = useState(null);

  // 백엔드 API 연동 - 카테고리 변경시에도 재조회
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 카테고리 필터 적용
        const category = selectedCategory === 'ALL' ? '' : selectedCategory;
        const response = await noticeApi.getNotices(0, 20, '', category); // 첫 페이지, 20개 조회
        console.log('공지사항 조회 응답:', response);
        
        // 백엔드 응답 구조에 맞게 수정
        if (response && response.notices) {
          setNotices(response.notices);
        } else if (Array.isArray(response)) {
          setNotices(response);
        } else {
          console.warn('예상과 다른 응답 구조:', response);
          setNotices([]);
        }
      } catch (error) {
        console.error('공지사항 조회 실패:', error);
        setError('공지사항을 불러오는 중 오류가 발생했습니다.');
        setNotices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, [selectedCategory]); // selectedCategory 변경시에도 재조회

  const categories = [
    { value: 'ALL', label: '전체' },
    { value: 'ANNOUNCEMENT', label: '공지사항' },
    { value: 'SYSTEM', label: '시스템' },
    { value: 'UPDATE', label: '업데이트' },
    { value: 'MAINTENANCE', label: '점검' }
  ];

  // 서버에서 필터링하므로 클라이언트 필터링 제거
  const filteredNotices = notices;

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
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              ⚠️ {error}
            </div>
          )}
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