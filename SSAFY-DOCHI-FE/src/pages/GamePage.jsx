import React, { useState } from 'react';

// 연한 룰렛 색상으로 설정 (명도 80% 기준)
const rouletteColors = ["#FFCDD2", "#FFE0B2", "#FFF9C4", "#C8E6C9", "#BBDEFB", "#E1BEE7"];

const GamePage = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [pointerAngle, setPointerAngle] = useState(0); // 화살표 각도(12시=0° 기준)

  const segmentAngle = items.length > 0 ? 360 / items.length : 360;

  // 12시가 0°가 되도록 -90°에서 시작
  const wheelStyle = {
    background:
      items.length > 0
        ? `conic-gradient(from -90deg, ${items
            .map((_, index) =>
              `${rouletteColors[index % rouletteColors.length]} ${index * segmentAngle}deg ${(index + 1) * segmentAngle}deg`
            )
            .join(', ')})`
        : '#f9fafb',
    transform: `rotate(${rotation}deg)`,
    willChange: 'transform',
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItem.trim() !== '' && items.length < 6) {
      setItems([newItem.trim(), ...items]); // 새 항목을 배열 맨 앞에 추가 (최상단 표시)
      setNewItem('');
    } else if (items.length >= 6) {
      alert('항목은 최대 6개까지 추가할 수 있습니다.');
    }
  };

  const handleRemoveItem = (indexToRemove) => {
    setItems(items.filter((_, index) => index !== indexToRemove));
  };

  const handleSpin = () => {
  if (isSpinning || items.length < 2) {
    alert('룰렛을 돌리려면 2개 이상의 항목이 필요합니다.');
    return;
  }
  setIsSpinning(true);

  const winnerIndex = Math.floor(Math.random() * items.length);

  // 당첨 조각 내부에서 랜덤 위치 선택 (경계에 너무 바짝 붙지 않도록 margin 사용)
  const marginDeg = Math.min(6, segmentAngle * 0.15); // 각도 여유(최대 6도)
  const segStart = -90 + winnerIndex * segmentAngle;            // 조각 시작각
  const segEnd   = -90 + (winnerIndex + 1) * segmentAngle;      // 조각 끝각
  const targetAngle =
    (segStart + marginDeg) + Math.random() * ((segEnd - marginDeg) - (segStart + marginDeg));

  // 화살표는 12시(0°) 고정. 현재 회전(prev)에서 targetAngle이 0°로 오도록 추가 회전량 계산
  setRotation((prev) => {
    const normalizedPrev = ((prev % 360) + 360) % 360;
    const delta = (0 - ((targetAngle + normalizedPrev) % 360) + 360) % 360;
    const extraSpins = 360 * 5; // 보기 좋은 전체 회전 수
    return prev + extraSpins + delta;
  });

  setTimeout(() => {
    setIsSpinning(false);
    setWinner(`선택된 항목: "${items[winnerIndex]}"`);
  }, 5000);
};

  return (
    <div className="bg-white min-h-screen flex justify-center font-['Pretendard'] text-gray-800">
      <div className="w-full max-w-[1080px] bg-white">
        {/* 헤더 섹션 */}
        <div className="text-center py-8 px-4">
          <h1 className="text-2xl font-bold mb-2 text-[#bf7d2c]">
            참견도치 룰렛
          </h1>
          <p className="text-sm text-gray-600">오늘의 고민거리를 참견도치가 골라드릴게요!</p>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex justify-center px-4 py-8">
          <div className="w-full max-w-[900px]">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
              {/* 왼쪽: 룰렛 섹션 - 황금비의 긴 부분 (3 컬럼) */}
              <div className="xl:col-span-3 flex flex-col items-center justify-center">
                <div className="relative flex justify-center items-center w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] lg:w-[380px] lg:h-[380px] flex-shrink-0">

                {/* 🔻 포인터(부모를 회전시켜 위치를 랜덤 배치) */}
                <div
                  className="absolute inset-0 z-20 pointer-events-none transition-transform duration-300"
                  style={{ transform: `rotate(${pointerAngle}deg)` }}
                >
                  <div
                    className="absolute top-[-15px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-[#bf7d2c]"
                  />
                </div>

                {/* 룰렛 휠 */}
                <div
                  className="w-full h-full rounded-full border-8 border-[#bf7d2c] relative overflow-hidden transition-transform duration-[5000ms] ease-[cubic-bezier(0.1,0.7,0.3,1)]"
                  style={{ ...wheelStyle, borderRadius: '50%' }}
                >
                  {items.map((item, index) => {
                    // 라벨도 -90° 기준 중앙각에 배치
                    const centerAngle = -90 + index * segmentAngle + segmentAngle / 2;
                    let fontSizeClass = 'text-base';
                    if (item.length > 5) fontSizeClass = 'text-sm';
                    if (item.length > 8) fontSizeClass = 'text-xs';
                    return (
                      <div
                        key={index}
                        className="absolute top-0 left-0 w-full h-full"
                        style={{ transform: `rotate(${centerAngle}deg)` }}
                      >
                        <div
                          className="absolute top-[25%] left-1/2 -translate-x-1/2"
                          style={{ transform: `rotate(${-centerAngle}deg)` }}
                        >
                          <span className={`block text-center w-28 text-gray-900 font-bold truncate ${fontSizeClass}`}>
                            {item}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 스핀 버튼 */}
                <button
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#bf7d2c] z-30 flex justify-center items-center transition-all duration-200 hover:bg-[#a66a25] hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                  style={{ borderRadius: '50%' }}
                >
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
                  </svg>
                </button>
              </div>

                {/* 룰렛 설명 */}
                <p className="text-xs text-[#666] mt-4 text-center max-w-sm">
                  {items.length < 2 ? '항목을 2개 이상 추가한 후 룰렛을 돌려보세요!' : '룰렛을 클릭하여 참견도치가 고민을 선택해드릴게요!'}
                </p>
              </div>

              {/* 오른쪽: 항목 관리 섹션 - 황금비의 짧은 부분 (2 컬럼) */}
              <div className="xl:col-span-2 flex flex-col h-[520px]">
                <div className="flex flex-col h-full bg-gray-50 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-[#333] mb-4 flex items-center gap-2">
                    고민 목록 <span className="text-xs text-[#666]">({items.length}/6)</span>
                  </h3>

                  {/* 항목 리스트 - 고정 높이로 스크롤 가능 */}
                  <div className="flex-1 overflow-y-auto mb-4" style={{ minHeight: '300px', maxHeight: '300px' }}>
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 flex justify-between items-center border border-gray-100">
                          <span className="text-[#333] truncate pr-2 text-sm">{item}</span>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-[#666] hover:text-red-500 hover:bg-red-50 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 text-sm font-bold"
                            title="항목 삭제"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 입력 폼 - 최하단 고정 */}
                  <div className="mt-auto border-t border-gray-200 pt-4">
                    {items.length < 6 ? (
                      <form onSubmit={handleAddItem} className="space-y-4">
                        <div>
                          <label className="block text-left text-[#333] font-medium mb-1 text-sm">
                            새 고민
                          </label>
                          <input
                            type="text"
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            placeholder="새 고민을 입력하세요..."
                            className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-sm transition-colors placeholder-gray-400"
                          />
                        </div>
                        <div className="flex justify-center">
                          <button
                            type="submit"
                            className="px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 text-xs"
                            style={{ 
                              backgroundColor: '#bf7d2c', 
                              color: 'white',
                              border: 'none'
                            }}
                            onMouseEnter={(e) => !newItem.trim() || (e.target.style.backgroundColor = '#D2691E')}
                            onMouseLeave={(e) => !newItem.trim() || (e.target.style.backgroundColor = '#bf7d2c')}
                            disabled={!newItem.trim()}
                          >
                            고민 추가하기
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-[#666] text-xs">최대 6개까지 추가 가능합니다</p>
                        <p className="text-[#999] text-xs mt-1">항목을 삭제한 후 새로운 고민을 추가해보세요</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 결과 표시 */}
        {winner && (
          <div className="flex justify-center px-4 pb-8">
            <div className="w-full max-w-[900px] text-center">
              <h3 className="text-lg font-bold text-[#333] mb-4">참견도치가 선택했어요!</h3>
              <div className="text-xl font-bold text-[#bf7d2c] bg-orange-50 rounded-lg p-4 border border-orange-100 mb-4">
                {winner.replace('선택된 항목: ', '')}
              </div>
              <p className="text-[#666] text-sm mb-4">이 고민부터 해결해보는 건 어떨까요?</p>
              <button
                onClick={() => setWinner(null)}
                className="px-6 py-2 rounded-lg font-medium transition-colors text-xs"
                style={{ 
                  backgroundColor: '#bf7d2c', 
                  color: 'white',
                  border: 'none'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#D2691E'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#bf7d2c'}
              >
                다시 돌리기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePage;
