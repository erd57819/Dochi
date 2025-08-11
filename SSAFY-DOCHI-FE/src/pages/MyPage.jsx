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
    navigate(`/conflicts/${conflictId}`);
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

        {/* 카드 그리드 - 3열 고정 */}
        <div className="flex justify-center px-4 lg:px-8 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-40 gap-y-20 max-w-[1000px] justify-items-center">
          
          {/* 등록된 갈등 카드들 */}
          {conflicts.map((conflict) => (
            <ConflictCard
              key={`conflict-${conflict.id}`}
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
              buttonText="자세히 보기"
              onButtonClick={() => handleCardClick(conflict.id)}
            />
          ))}

          {/* 3의 배수로 맞추기 위한 빈 카드들 */}
          {Array.from({ length: getEmptyCardsCount() }).map((_, index) => (
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