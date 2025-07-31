import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MyPageNavigation from "../components/MyPageNavigation";
import ConflictCard from "../components/ConflictCard";
import myPageApi from "../services/myPageApi";

const MyPage = () => {
  const navigate = useNavigate();
  const [conflictCount, setConflictCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 갈등 개수 로드
  useEffect(() => {
    loadConflictCount();
  }, []);

  const loadConflictCount = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await myPageApi.getUserConflictCount();
      setConflictCount(response.count || 0);
    } catch (err) {
      console.error('갈등 개수 로드 실패:', err);
      setError('갈등 개수를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (index) => {
    // 실제 갈등 ID로 이동 (나중에 수정)
    navigate(`/conflicts/${index + 1}`);
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
                onClick={loadConflictCount}
                className="ml-4 text-red-800 underline hover:no-underline"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* 카드 그리드 - 3열 고정 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-8 lg:px-16">
          
          {/* 등록된 갈등 카드들 */}
          {Array.from({ length: conflictCount }).map((_, index) => (
            <ConflictCard
              key={`conflict-${index}`}
              type="normal"
              date={null} // 또는 "갈등 등록일" 표시
              title="집안일 분담\n관련 갈등"
              buttonText="자세히 보기"
              onButtonClick={() => handleCardClick(index)}
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
  );
};

export default MyPage;