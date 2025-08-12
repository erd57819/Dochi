import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { noticeApi } from '../services/noticeApi';
import useAuthStore from '../stores/AuthStore';
import hedgehogImg from '../assets/conflict.png';

const NoticePage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [error, setError] = useState(null);
  const [expandedNotices, setExpandedNotices] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'ANNOUNCEMENT',
    isImportant: false
  });

  // 더미 데이터
  const dummyNotices = [
    {
      id: 1,
      title: "참견도치 서비스 정식 오픈 안내",
      content: "안녕하세요! 참견도치 서비스가 드디어 정식으로 오픈되었습니다.\nAI 기반 갈등 해결 서비스로 여러분의 고민을 함께 해결해드립니다.\n저희 참견도치는 감정 분석, 대화 패턴 인식, 맞춤형 해결책 제시 등 다양한 AI 기능을 통해 여러분의 일상 갈등을 해결하는 데 도움을 드립니다.\n주요 기능으로는 토닥토닥 서비스, 갈등 중재 서비스, 커뮤니티 소통 등이 있으며, 24시간 언제나 이용 가능합니다.",
      category: "ANNOUNCEMENT",
      publishDate: "2025-01-10",
      viewCount: 1247,
      isImportant: true
    },
    {
      id: 2,
      title: "새로운 토닥토닥 기능 업데이트",
      content: "토닥토닥 서비스에 감정 분석 기능이 추가되었습니다.\n더욱 정확한 위로와 조언을 받아보세요.",
      category: "UPDATE",
      publishDate: "2025-01-08",
      viewCount: 892,
      isImportant: false
    },
    {
      id: 3,
      title: "서버 정기 점검 안내 (1월 15일)",
      content: "더 나은 서비스 제공을 위해 정기 점검을 실시합니다.\n점검 시간: 2025년 1월 15일 오전 2시 ~ 오전 6시 (약 4시간)\n점검 내용: 데이터베이스 최적화, 서버 보안 업데이트, AI 모델 성능 개선 작업을 진행할 예정입니다.\n점검 기간 중에는 모든 서비스 이용이 일시 중단되며, 점검 완료 후 더욱 개선된 서비스를 만나보실 수 있습니다.",
      category: "MAINTENANCE",
      publishDate: "2025-01-06",
      viewCount: 634,
      isImportant: true
    },
    {
      id: 4,
      title: "화상 채팅 시스템 개선 완료",
      content: "갈등 해결 화상 채팅의 연결 안정성과 음성 품질이 대폭 개선되었습니다.\n보다 원활한 상담 서비스를 이용하실 수 있습니다.",
      category: "UPDATE",
      publishDate: "2025-01-05",
      viewCount: 445,
      isImportant: false
    },
    {
      id: 5,
      title: "커뮤니티 이용 가이드라인 업데이트",
      content: "건전한 커뮤니티 환경 조성을 위해 이용 가이드라인이 업데이트되었습니다.\n모든 회원분들께서는 새로운 가이드라인을 확인해주세요.",
      category: "ANNOUNCEMENT",
      publishDate: "2025-01-03",
      viewCount: 721,
      isImportant: false
    }
  ];

  useEffect(() => {
    const fetchNotices = () => {
      setLoading(true);
      
      // 더미 데이터 로딩 시뮬레이션
      setTimeout(() => {
        let filteredData = dummyNotices;
        
        // 카테고리 필터 적용
        if (selectedCategory !== 'ALL') {
          filteredData = dummyNotices.filter(notice => notice.category === selectedCategory);
        }
        
        setNotices(filteredData);
        setLoading(false);
      }, 500);
    };

    fetchNotices();
  }, [selectedCategory]);

  const categories = [
    { value: 'ALL', label: '전체', color: '#83673f', gradient: 'linear-gradient(135deg, #83673f 0%, #a58659 100%)' },
    { value: 'ANNOUNCEMENT', label: '공지사항', color: '#cd9f6e', gradient: 'linear-gradient(135deg, #cd9f6e 0%, #e6b88a 100%)' },
    { value: 'UPDATE', label: '업데이트', color: '#EE9278', gradient: 'linear-gradient(135deg, #EE9278 0%, #f5a893 100%)' },
    { value: 'MAINTENANCE', label: '점검', color: '#7F5539', gradient: 'linear-gradient(135deg, #7F5539 0%, #a06d4d 100%)' }
  ];

  const filteredNotices = notices;

  // 임시로 특정 userId에 대해 ADMIN 권한 부여 (테스트용)
  // TODO: 백엔드에서 role 정보가 제대로 전달되면 이 코드 삭제
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin' || 
                  user?.userId === 'admin' || user?.userId === 'test'

  // 공지사항 내용 토글 함수
  const toggleNoticeExpansion = (noticeId) => {
    const newExpanded = new Set(expandedNotices);
    if (newExpanded.has(noticeId)) {
      newExpanded.delete(noticeId);
    } else {
      newExpanded.add(noticeId);
    }
    setExpandedNotices(newExpanded);
  };

  // 텍스트가 긴지 확인하는 함수 (2줄 이상)
  const isLongContent = (content) => {
    return content && content.split('\n').length > 2;
  };

  // 텍스트를 잘라서 표시하는 함수
  const getTruncatedContent = (content, isExpanded) => {
    if (!content) return '';
    if (isExpanded) {
      return content;
    }
    
    // 줄바꿈으로 분할하여 첫 2줄만 표시
    const lines = content.split('\n');
    if (lines.length <= 2) {
      return content;
    }
    return lines.slice(0, 2).join('\n') + '...';
  };

  // 공지사항 삭제 함수
  const handleDeleteNotice = async (noticeId, e) => {
    e.stopPropagation();
    if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      try {
        // API 호출 구현 필요
        // await noticeApi.deleteNotice(noticeId);
        alert('공지사항이 삭제되었습니다.');
        // 삭제 후 목록 새로고침
        setNotices(notices.filter(n => n.id !== noticeId));
      } catch (error) {
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 공지사항 생성 모달 열기
  const handleCreateNotice = () => {
    setEditingNotice(null);
    setFormData({
      title: '',
      content: '',
      category: 'ANNOUNCEMENT',
      isImportant: false
    });
    setShowModal(true);
  };

  // 공지사항 수정 모달 열기
  const handleEditNotice = (notice, e) => {
    e.stopPropagation();
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      isImportant: notice.isImportant || false
    });
    setShowModal(true);
  };

  // 폼 입력 처리
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 공지사항 저장 (생성/수정)
  const handleSaveNotice = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    
    if (!formData.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      if (editingNotice) {
        // 수정 API 호출
        // await noticeApi.updateNotice(editingNotice.id, formData);
        
        // 더미 데이터 업데이트
        setNotices(notices.map(n => 
          n.id === editingNotice.id 
            ? { ...n, ...formData }
            : n
        ));
        alert('공지사항이 수정되었습니다.');
      } else {
        // 생성 API 호출
        // await noticeApi.createNotice(formData);
        
        // 더미 데이터 추가
        const newNotice = {
          id: Date.now(),
          ...formData,
          publishDate: new Date().toISOString().split('T')[0],
          viewCount: 0
        };
        setNotices([newNotice, ...notices]);
        alert('공지사항이 작성되었습니다.');
      }
      setShowModal(false);
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      
      {/* 메인 컨텐츠 */}
      <main className="max-w-5xl mx-auto px-3 py-10">
        {/* 상단 인사말 */}
        <div className="flex flex-row items-center justify-between text-3xl font-bold mb-4 p-2" style={{ color: '#8B4513' }}>
          <div className="flex items-center gap-4">
            <img src={hedgehogImg} alt="갈등도치" className="w-10 h-10" />
            <div>
              <h3 className="text-4xl font-bold" style={{ color: '#333333' }}>
                {selectedCategoryData?.label === '공지사항' ? '공지사항' : `${selectedCategoryData?.label || '전체'} 공지사항`}
              </h3>
              <p className="text-base" style={{ color: '#666666' }}>
                총 {filteredNotices.length}건의 공지사항
              </p>
            </div>
          </div>
          {/* 관리자인 경우 글쓰기 버튼 표시 */}
          {isLoggedIn && user && isAdmin && (
            <button
              onClick={handleCreateNotice}
              className="px-5 py-2 text-white text-lg font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #cd9f6e 0%, #e6b88a 100%)'
              }}
            >
              공지사항 작성
            </button>
          )}
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
            <div className="space-y-2 mb-6 bg-white p-2 rounded-lg">
              {categories.map((category) => (
                <div
                  key={category.value}
                  className="p-2 rounded cursor-pointer transition-all transform hover:-translate-y-1"
                  style={{
                    background: selectedCategory === category.value ? category.gradient : '#FFFFFF',
                    color: selectedCategory === category.value ? '#FFFFFF' : '#333333',
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
                      <h4 className="font-bold text-base" style={{ color: 'inherit' }}>{category.label}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 공지사항 가이드 */}
            <div className="bg-white rounded p-5">
              <h4 className="font-bold text-lg mb-3" style={{ color: '#8B4513' }}>📰 공지사항 가이드</h4>
              <ul className="space-y-2" style={{ color: '#666666' }}>
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
                        className="px-5 py-5 cursor-pointer transition-all duration-100 hover:bg-orange-50 rounded-r-lg"
                        onClick={() => {
                          if (isLongContent(notice.content)) {
                            toggleNoticeExpansion(notice.id);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="flex gap-3 items-center flex-1 min-w-0">
                            <span
                              className="text-white text-xs px-2 py-1 rounded font-medium"
                              style={{ 
                                background: noticeCategoryData?.color || '#8B4513'
                              }}
                            >
                              {noticeCategoryData?.label || notice.category}
                            </span>
                            <h4
                              className="text-xl font-bold transition-colors truncate"
                              style={{ color: '#333333' }}
                            >
                              {notice.title}
                            </h4>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm" style={{ color: '#666666' }}>
                              <span>{notice.publishDate}</span>
                              {isLongContent(notice.content) && (
                                <svg 
                                  className={`w-4 h-4 transition-transform duration-200 ${expandedNotices.has(notice.id) ? 'transform rotate-180' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between pl-2">
                          <div>
                          <p className="text-gray-600 text-sm mb-2 leading-relaxed whitespace-pre-wrap">
                            {getTruncatedContent(notice.content, expandedNotices.has(notice.id))}
                          </p>
                          </div>
                          <div>
                            {/* 관리자인 경우 수정/삭제 버튼 표시 */}
                            {isLoggedIn && user && isAdmin && (
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => handleEditNotice(notice, e)}
                                  className="px-2 py-1 w-12 h-8 text-xs font-medium text-white rounded-md transition-all duration-100 hover:scale-105"
                                  style={{ backgroundColor: '#CD9F6E' }}
                                >
                                  수정
                                </button>
                                <button
                                  onClick={(e) => handleDeleteNotice(notice.id, e)}
                                  className="px-2 py-1 w-12 h-8 text-xs font-medium text-white rounded-md transition-all duration-100 hover:scale-105"
                                  style={{ backgroundColor: '#EE9278' }}
                                >
                                  삭제
                                </button>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 공지사항 생성/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50 p-4">
          <div className="bg-orange-50 rounded-md max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold" style={{ color: '#8B4513' }}>
                  {editingNotice ? '공지사항 수정' : '공지사항 작성'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-black hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSaveNotice} className="space-y-3">
                {/* 카테고리 선택 */}
                <div>
                  <label className="block text-md font-medium text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border bg-gry-50 border-orange-700 text-lg text-gray-600 hover:text-gray-800 rounded focus:ring-orange-700 focus:bg-orange-100"
                    required
                  >
                    <option value="ANNOUNCEMENT">공지사항</option>
                    <option value="UPDATE">업데이트</option>
                    <option value="MAINTENANCE">점검</option>
                  </select>
                </div>

                {/* 제목 입력 */}
                <div>
                  <label className="block text-md font-medium text-gray-700 mb-2">
                    제목 *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-orange-700 text-lg text-gray-600 hover:text-gray-800 rounded focus:ring-orange-700 "
                    placeholder="공지사항 제목을 입력해주세요"
                    required
                  />
                </div>

                {/* 내용 입력 */}
                <div>
                  <label className="block text-md font-medium text-gray-700 mb-2">
                    내용 *
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={8}
                    className="w-full px-3 py-3 border border-orange-700 text-lg text-gray-600 hover:text-gray-800 rounded focus:ring-orange-700 resize-none"
                    placeholder="공지사항 내용을 입력해주세요"
                    required
                  />
                </div>

                {/* 중요 공지 체크 */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isImportant"
                    name="isImportant"
                    checked={formData.isImportant}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isImportant" className="ml-2 text-sm text-gray-700">
                    중요 공지사항으로 설정
                  </label>
                </div>

                {/* 버튼 그룹 */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #cd9f6e 0%, #e6b88a 100%)'
                    }}
                  >
                    {editingNotice ? '수정 완료' : '작성 완료'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticePage;