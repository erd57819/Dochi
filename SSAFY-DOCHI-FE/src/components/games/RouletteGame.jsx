import React, { useState } from 'react';

// 기존 룰렛 색상 유지
const rouletteColors = ["#F44336", "#FF9800", "#FFC107", "#4CAF50", "#2196F3", "#9C27B0"];

const RouletteGame = ({ onBack }) => {
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
      setItems([newItem.trim(), ...items]); // 새 항목을 배열 맨 앞에 추가
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
    <div className="w-full">
      {/* 뒤로가기 버튼 */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-[#bf7d2c] hover:bg-orange-50 rounded-lg transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          게임 선택으로 돌아가기
        </button>
      </div>

      {/* 헤더 섹션 */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 text-[#bf7d2c]">
          참견도치 룰렛
        </h1>
        <p className="text-lg text-gray-600">오늘의 고민거리를 참견도치가 골라드릴게요!</p>
      </div>

      {/* 메인 컨텐츠 카드 */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex flex-col lg:flex-row justify-center items-center lg:items-start gap-12 lg:gap-16 w-full">
          {/* 룰렛 섹션 */}
          <div className="flex flex-col items-center">
            <div className="relative flex justify-center items-center w-[350px] h-[350px] sm:w-[400px] sm:h-[400px] lg:w-[440px] lg:h-[440px] flex-shrink-0">

              {/* 🔻 포인터(부모를 회전시켜 위치를 랜덤 배치) */}
              <div
                className="absolute inset-0 z-20 pointer-events-none transition-transform duration-300"
                style={{ transform: `rotate(${pointerAngle}deg)` }}
              >
                <div
                  className="absolute top-[-15px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-[#bf7d2c] drop-shadow-md"
                />
              </div>

              {/* 룰렛 휠 */}
              <div
                className="w-full h-full rounded-full border-8 border-[#bf7d2c] shadow-2xl relative overflow-hidden transition-transform duration-[5000ms] ease-[cubic-bezier(0.1,0.7,0.3,1)]"
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
                        <span className={`block text-center w-28 text-white font-bold drop-shadow-lg truncate ${fontSizeClass}`}>
                          {item}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 중앙 고슴도치 버튼 */}
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#bf7d2c] to-[#a66a25] shadow-xl z-30 flex justify-center items-center transition-all duration-200 hover:from-[#a66a25] hover:to-[#8f5920] hover:scale-110 active:scale-95 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:scale-100 border-4 border-white"
                style={{ borderRadius: '50%' }}
              >
                <div className="flex flex-col items-center">
                  <span className="text-4xl sm:text-5xl select-none">{isSpinning ? '🎰' : '🦔'}</span>
                  {!isSpinning && <span className="text-[10px] text-white font-bold mt-1">SPIN!</span>}
                </div>
              </button>
            </div>

            {/* 룰렛 설명 */}
            <p className="text-sm text-gray-500 mt-4 text-center max-w-sm">
              {items.length < 2 ? '항목을 2개 이상 추가한 후 룰렛을 돌려보세요!' : '룰렛을 클릭하여 참견도치가 고민을 선택해드릴게요!'}
            </p>
          </div>

          {/* 항목 관리 섹션 */}
          <div className="w-full max-w-md lg:w-96 flex flex-col">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                📝 고민 목록 <span className="text-sm text-gray-500">({items.length}/6)</span>
              </h3>

              {/* 항목 리스트 - 맨 위부터 표시 */}
              <div className="space-y-3 mb-4">
                {items.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 flex justify-between items-center shadow-sm border border-gray-100">
                    <span className="text-gray-700 truncate pr-2 font-medium">{item}</span>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 font-bold text-lg"
                      title="항목 삭제"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* 입력 폼 - 맨 아래 위치 */}
              {items.length < 6 && (
                <form onSubmit={handleAddItem} className="space-y-3">
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="새 고민을 입력하세요..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bf7d2c] focus:border-transparent text-gray-800 placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#7f5539] text-white py-3 rounded-lg font-semibold hover:bg-[#6d4a31] transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    disabled={!newItem.trim()}
                  >
                    고민 추가하기
                  </button>
                </form>
              )}
              
              {/* 6개 다 찼을 때 메시지 */}
              {items.length >= 6 && (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">최대 6개까지 추가 가능합니다</p>
                  <p className="text-gray-400 text-xs mt-1">항목을 삭제한 후 새로운 고민을 추가해보세요</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 결과 표시 */}
      {winner && (
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-4">참견도치가 선택했어요!</h3>
          <div className="text-2xl font-bold text-[#bf7d2c] bg-orange-50 rounded-lg p-4 border border-orange-100">
            {winner.replace('선택된 항목: ', '')}
          </div>
          <p className="text-gray-600 mt-3">이 고민부터 해결해보는 건 어떨까요? 🦔</p>
          <button
            onClick={() => setWinner(null)}
            className="mt-4 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
          >
            다시 돌리기
          </button>
        </div>
      )}
    </div>
  );
};

export default RouletteGame;