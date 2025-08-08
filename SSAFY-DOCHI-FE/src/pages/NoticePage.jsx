import React, { useState, useEffect } from 'react';
import { noticeApi } from '../services/noticeApi';
import hedgehogImg from '../assets/conflict.png';

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
    { value: 'ALL', label: '전체', color: '#83673f', gradient: 'linear-gradient(135deg, #83673f 0%, #a58659 100%)' },
    { value: 'ANNOUNCEMENT', label: '공지사항', color: '#cd9f6e', gradient: 'linear-gradient(135deg, #cd9f6e 0%, #e6b88a 100%)' },
    { value: 'SYSTEM', label: '시스템', color: '#EE9278', gradient: 'linear-gradient(135deg, #EE9278 0%, #f5a893 100%)' },
    { value: 'UPDATE', label: '업데이트', color: '#f8d6b3', gradient: 'linear-gradient(135deg, #f8d6b3 0%, #ffe4cc 100%)' },
    { value: 'MAINTENANCE', label: '점검', color: '#7F5539', gradient: 'linear-gradient(135deg, #7F5539 0%, #a06d4d 100%)' }
  ];

  // 서버에서 필터링하므로 클라이언트 필터링 제거
  const filteredNotices = notices;

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
            <p className="text-xl font-bold animate-pulse" style={{ color: '#8B4513' }}>
              공지사항을 불러오는 중...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedCategoryData = categories.find(cat => cat.value === selectedCategory);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative">
      {/* 전체 배경 컨테이너 */}
      <div className="absolute inset-0">
        {/* 상단 배경 */}
        <div 
          className="absolute top-0 left-0 w-full" 
          style={{ 
            height: '100%',
            opacity: 0.14
          }}
        ></div>
        
        {/* 하단 배경 */}
        <div 
          className="absolute bottom-0 left-0 w-full" 
          style={{
            backgroundColor: '#FFFFFF'
          }}
        ></div>
      </div>
      
      {/* 메인 컨텐츠 */}
      <main className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        {/* 상단 인사말 */}
        <div className="flex flex-row items-center justify-between text-4xl font-bold mb-5 p-2" style={{ color: '#8B4513' }}>
          <div className="flex items-center gap-4">
            <img src={hedgehogImg} alt="갈등도치" className="w-12 h-12 animate-bounce" />
            <div>
              <h3 className="text-5xl font-bold" style={{ color: '#333333' }}>
                {selectedCategoryData?.label || '전체'} 공지사항
              </h3>
              <p className="text-lg" style={{ color: '#666666' }}>
                총 {filteredNotices.length}건의 공지사항
              </p>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap justify-between gap-5">

          {/* 왼쪽: 카테고리 목록 */}
          <div className="w-1/4">
            <div className="space-y-3 mb-8 bg-white p-2 rounded-lg">
              {categories.map((category) => (
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
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== category.value) {
                      e.currentTarget.style.background = '#FFFFFF';
                      e.currentTarget.style.color = '#333333';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                  onClick={() => setSelectedCategory(category.value)}
                >
                  <div className="flex items-center pl-5 gap-4">
                    <div>
                      <h4 className="font-bold text-lg" style={{ color: 'inherit' }}>{category.label}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 공지사항 가이드 */}
            <div className="bg-white rounded p-6">
              <h4 className="font-bold text-xl mb-4" style={{ color: '#8B4513' }}>📰 공지사항 가이드</h4>
              <ul className="space-y-3" style={{ color: '#666666' }}>
                <li className="flex items-center gap-2">
                  <span style={{ color: '#BF7D2C' }}>•</span>
                  중요한 업데이트 확인
                </li>
                <li className="flex items-center gap-2">
                  <span style={{ color: '#BF7D2C' }}>•</span>
                  서비스 점검 안내
                </li>
                <li className="flex items-center gap-2">
                  <span style={{ color: '#BF7D2C' }}>•</span>
                  새로운 기능 소개
                </li>
                <li className="flex items-center gap-2">
                  <span style={{ color: '#BF7D2C' }}>•</span>
                  이용 정책 변경
                </li>
              </ul>
            </div>
          </div>

          {/* 오른쪽: 공지사항 목록 */}
          <div className="w-5/7">
            <div className="bg-white rounded-xl min-h-[600px]">
              <div className="space-y-1">
                {filteredNotices.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-6">📰</div>
                    <h4 className="text-2xl font-bold mb-4" style={{ color: '#333333' }}>
                      해당 카테고리의 공지사항이 없습니다
                    </h4>
                    <p className="text-lg" style={{ color: '#666666' }}>
                      새로운 소식을 기다려주세요!
                    </p>
                  </div>
                ) : (
                  filteredNotices.map((notice) => {
                    const noticeCategoryData = categories.find(cat => cat.value === notice.category) || selectedCategoryData;
                    
                    return (
                      <div
                        key={notice.id}
                        className="px-6 py-6 cursor-pointer transition-all duration-100 hover:bg-orange-50 rounded-r-lg"
                      >
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="flex gap-3 items-center flex-1 min-w-0">
                            {notice.isImportant && (
                              <span className="bg-red-500 text-white text-xs px-3 py-2 rounded-full font-medium min-w-[50px] text-center">
                                중요
                              </span>
                            )}
                            <span
                              className="text-xs px-3 py-2 rounded-full font-medium text-white min-w-[80px] text-center shadow-md"
                              style={{ 
                                background: noticeCategoryData?.gradient || 'linear-gradient(135deg, #8B4513 0%, #cd9f6e 100%)',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                              }}
                            >
                              {noticeCategoryData?.label || notice.category}
                            </span>
                            <h4
                              className="text-2xl font-bold transition-colors truncate"
                              style={{ color: '#333333' }}
                            >
                              {notice.title}
                            </h4>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm" style={{ color: '#666666' }}>
                            <span>👁 {notice.viewCount || 0}</span>
                            <span className="text-gray-400">•</span>
                            <span>{notice.publishDate}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2 pl-2">
                          {notice.content}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NoticePage;