import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MyPageNavigation from "../components/MyPageNavigation";
import ConflictCard from "../components/ConflictCard";
import myPageApi from "../services/myPageApi";
import useAuthStore from "../stores/AuthStore.js";

const MyPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const [conflictCount, setConflictCount] = useState(0);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedConflicts, setSelectedConflicts] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);

  // 비로그인 시 접근 차단
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return (
      <div className="bg-white min-h-screen flex justify-center items-center">
        <div className="text-lg text-gray-600">로그인 페이지로 이동 중...</div>
      </div>
    );
  }

  // 갈등 데이터 로드
  useEffect(() => {
    loadConflictData();
  }, []);

  const loadConflictData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 갈등 개수와 목록을 동시에 불러오기
      const [countResponse, conflictsResponse] = await Promise.all([
        myPageApi.getUserConflictCount(),
        myPageApi.getUserConflicts()
      ]);
      
      setConflictCount(countResponse.count || 0);
      setConflicts(conflictsResponse.data || []);
    } catch (err) {
      console.error('갈등 데이터 로드 실패:', err);
      setError('갈등 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (conflictId) => {
    if (isEditMode) {
      toggleSelectConflict(conflictId);
    } else {
      navigate(`/conflicts/${conflictId}`);
    }
  };

  const toggleSelectConflict = (conflictId) => {
    setSelectedConflicts(prev => 
      prev.includes(conflictId) 
        ? prev.filter(id => id !== conflictId)
        : [...prev, conflictId]
    );
  };

  const handleEditModeToggle = () => {
    setIsEditMode(!isEditMode);
    setSelectedConflicts([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedConflicts.length === 0) {
      alert('삭제할 갈등을 선택해주세요.');
      return;
    }

    const confirmed = window.confirm(`선택한 ${selectedConflicts.length}개의 갈등을 삭제하시겠습니까?`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await Promise.all(
        selectedConflicts.map(conflictId => 
          myPageApi.deleteConflict(conflictId)
        )
      );
      
      alert('선택한 갈등이 삭제되었습니다.');
      setSelectedConflicts([]);
      setIsEditMode(false);
      await loadConflictData(); // 데이터 재로드
    } catch (error) {
      console.error('갈등 삭제 실패:', error);
      alert('갈등 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const selectAllConflicts = () => {
    if (selectedConflicts.length === conflicts.length) {
      setSelectedConflicts([]);
    } else {
      setSelectedConflicts(conflicts.map(c => c.id));
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e, index) => {
    if (!isEditMode) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.dataTransfer.setDragImage(e.target, 0, 0);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDraggedOverIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    setDraggedOverIndex(index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    const newConflicts = [...conflicts];
    const draggedConflict = newConflicts[draggedIndex];
    
    // 드래그된 항목 제거
    newConflicts.splice(draggedIndex, 1);
    
    // 새 위치에 삽입
    newConflicts.splice(dropIndex, 0, draggedConflict);
    
    setConflicts(newConflicts);
    setDraggedIndex(null);
    setDraggedOverIndex(null);
  };

  const handleCreateClick = () => {
    navigate("/conflicts/create");
  };

  // 3의 배수로 카드 배치 계산
  const getTotalCards = () => {
    if (conflictCount === 0) return 3; // 갈등이 없으면 3개 빈 카드
    return Math.ceil(conflictCount / 3) * 3;
  };

  const getEmptyCardsCount = () => {
    const totalCards = getTotalCards();
    return totalCards - conflictCount;
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex justify-center">
        <div className="w-full max-w-[1440px] bg-white">
          <MyPageNavigation />
          <div className="flex justify-center items-center py-20">
            <div className="text-xl text-[#999999]">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex justify-center">
      <div className="w-full max-w-[1440px] bg-white">
        
        <MyPageNavigation />

        {error && (
          <div className="max-w-[600px] mx-auto px-8 mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
              <button 
                onClick={loadConflictData}
                className="ml-4 text-red-800 underline hover:no-underline"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* 헤더 - 제목과 통계 */}
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8 mb-12">
          <div className="text-center mb-8">
            <p className="text-gray-600 text-lg">
              지금까지 <span className="text-orange-600 font-bold">{conflictCount}개</span>의 갈등을 기록하셨어요
            </p>
          </div>

          {/* 편집 모드 버튼 */}
          {conflicts.length > 0 && (
            <div className="flex justify-end items-center mb-6">
              <div className="flex items-center gap-4">
                {isEditMode && (
                  <>
                    <span className="text-gray-600 text-sm">
                      {selectedConflicts.length}개 선택됨
                    </span>
                    
                    <button
                      onClick={selectAllConflicts}
                      className="px-3 py-2 rounded-lg font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all text-sm"
                    >
                      {selectedConflicts.length === conflicts.length ? '전체 해제' : '전체 선택'}
                    </button>
                    
                    {selectedConflicts.length > 0 && (
                      <button
                        onClick={handleDeleteSelected}
                        disabled={isDeleting}
                        className="px-3 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300 transition-all text-sm"
                      >
                        {isDeleting ? '삭제 중...' : `선택한 ${selectedConflicts.length}개 삭제`}
                      </button>
                    )}
                  </>
                )}
                
                <button
                  onClick={handleEditModeToggle}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isEditMode 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  {isEditMode ? '편집 완료' : '편집'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 카드 그리드 - 3열 고정 */}
        <div className="flex justify-center px-4 lg:px-8 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-8 max-w-[800px] justify-items-center">
          
          {/* 등록된 갈등 카드들 */}
          {conflicts.map((conflict, index) => (
            <div 
              key={`conflict-${conflict.id}`} 
              className={`relative transition-all duration-300 ${
                draggedIndex === index ? 'opacity-50 scale-95' : ''
              } ${
                draggedOverIndex === index ? 'transform scale-105' : ''
              }`}
              draggable={isEditMode}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              style={{
                cursor: isEditMode ? 'move' : 'pointer'
              }}
            >
              {isEditMode && (
                <>
                  <div className="absolute -top-2 -right-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedConflicts.includes(conflict.id)}
                      onChange={() => toggleSelectConflict(conflict.id)}
                      className="w-6 h-6 text-orange-600 bg-white border-2 border-gray-300 rounded-full focus:ring-orange-500 focus:ring-2"
                    />
                  </div>
                  <div className="absolute -top-2 -left-2 z-10 bg-gray-800 text-white text-xs px-2 py-1 rounded-full opacity-80">
                    ⋮⋮
                  </div>
                </>
              )}
              <ConflictCard
                type="normal"
                date={(() => {
                  const dateData = conflict.createdAt;
                  if (!dateData) return '등록일 미상';
                  
                  // LocalDateTime 배열 형식: [2025, 8, 10, 22, 35, 29]
                  if (Array.isArray(dateData) && dateData.length >= 3) {
                    const [year, month, day] = dateData;
                    const date = new Date(year, month - 1, day); // JS는 month가 0부터 시작
                    return date.toLocaleDateString('ko-KR');
                  }
                  
                  // 다른 형식일 경우
                  return new Date(dateData).toLocaleDateString('ko-KR');
                })()
                }
                title={conflict.title || conflict.description || "갈등 내용"}
                buttonText={isEditMode ? '선택' : '자세히 보기'}
                onButtonClick={() => handleCardClick(conflict.id)}
                isSelected={selectedConflicts.includes(conflict.id)}
                isEditMode={isEditMode}
              />
            </div>
          ))}

          {/* 3의 배수로 맞추기 위한 빈 카드들 */}
          {!isEditMode && Array.from({ length: getEmptyCardsCount() }).map((_, index) => (
            <ConflictCard
              key={`empty-${index}`}
              type="empty"
              buttonText="등록하러가기"
              onButtonClick={handleCreateClick}
            />
          ))}

          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPage;