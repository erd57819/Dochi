import React, { useState } from 'react';

// 기존 룰렛 색상 유지 및 수정
const rouletteColors = [
  "#F44336", "#FF9800", "#FFC107", "#4CAF50", "#2196F3", "#9C27B0"
];

const GamePage = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);

  const segmentAngle = items.length > 0 ? 360 / items.length : 360;

  const wheelStyle = {
    background: items.length > 0 ? `conic-gradient(
      ${items.map((item, index) => `${rouletteColors[index % rouletteColors.length]} ${index * segmentAngle}deg ${(index + 1) * segmentAngle}deg`).join(', ')}` : '#f9fafb',
    transform: `rotate(${rotation}deg)`,
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItem.trim() !== '' && items.length < 6) {
      setItems([...items, newItem.trim()]);
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
    
    // 각 세그먼트의 중앙에 멈추도록 각도 계산
    const targetAngle = (winnerIndex * segmentAngle) + (segmentAngle / 2);

    // 최종 회전 각도 계산.
    // 화살표가 위쪽(270도)에 있으므로, 목표 각도가 270도에 오도록 회전량을 정함.
    const totalRotation = (360 * 5) + 270 - targetAngle;
    
    setRotation(rotation + totalRotation);
    
    setTimeout(() => {
      setIsSpinning(false);
      setWinner(`선택된 항목: "${items[winnerIndex]}"`); // 결과 저장
    }, 5000);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 font-['Pretendard'] text-gray-800">
      <div className="w-full max-w-6xl mx-auto p-6 sm:p-8 lg:p-12">
        {/* 헤더 섹션 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
            <span className="bg-gradient-to-r from-[#ff6b35] via-[#bf7d2c] to-[#ff6b35] bg-clip-text text-transparent">
              참견도치 룰렛
            </span>
          </h1>
          <p className="text-lg text-gray-600">오늘의 고민거리를 참견도치가 골라드릴게요!</p>
        </div>
        
        {/* 메인 컨텐츠 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col lg:flex-row justify-center items-center lg:items-start gap-12 lg:gap-16 w-full">
            
            {/* 룰렛 섹션 */}
            <div className="flex flex-col items-center">
              <div 
                className="relative flex justify-center items-center w-[350px] h-[350px] sm:w-[400px] sm:h-[400px] lg:w-[440px] lg:h-[440px] flex-shrink-0"
              >
                {/* 화살표 포인터 */}
                <div 
                  className="absolute top-[-15px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-[#ff6b35] z-10 drop-shadow-md"
                ></div>
                
                {/* 룰렛 휠 */}
                <div
                  className="w-full h-full rounded-full border-8 border-[#ff6b35] shadow-2xl relative overflow-hidden transition-transform duration-[5000ms] ease-[cubic-bezier(0.1,0.7,0.3,1)]"
                  style={{...wheelStyle, borderRadius: '50%'}}
                >
                  {items.map((item, index) => {
                    const angle = segmentAngle * index + segmentAngle / 2;
                    let fontSizeClass = 'text-base';
                    if (item.length > 5) fontSizeClass = 'text-sm';
                    if (item.length > 8) fontSizeClass = 'text-xs';
                    return (
                      <div key={index} className="absolute top-0 left-0 w-full h-full" style={{ transform: `rotate(${angle}deg)` }}>
                        <div className="absolute top-[25%] left-1/2 -translate-x-1/2" style={{ transform: `rotate(${-angle}deg)` }}>
                          <span className={`block text-center w-28 text-white font-bold drop-shadow-lg truncate ${fontSizeClass}`}>{item}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* 스핀 버튼 */}
                <button
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-[#ff6b35] to-[#e55a2b] shadow-xl z-20 flex justify-center items-center transition-all duration-200 hover:from-[#e55a2b] hover:to-[#cc4d26] hover:scale-105 active:scale-95 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:scale-100"
                  style={{ borderRadius: '50%' }}
                >
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
                  </svg> 
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
                
                {/* 항목 리스트 */}
                <div className="space-y-3 mb-6">
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
                  
                  {/* 빈 슬롯 표시 */}
                  {Array.from({ length: Math.max(0, 6 - items.length) }).map((_, index) => (
                    <div key={`empty-${index}`} className="bg-gray-100 rounded-lg p-3 border-2 border-dashed border-gray-200">
                      <span className="text-gray-400 text-sm">빈 슬롯</span>
                    </div>
                  ))}
                </div>
                
                {/* 항목 추가 폼 */}
                <form onSubmit={handleAddItem} className="space-y-3">
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="새 고민을 입력하세요..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent text-gray-800 placeholder-gray-400"
                    disabled={items.length >= 6}
                  />
                  <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-[#7f5539] to-[#bf7d2c] text-white py-3 rounded-lg font-semibold hover:from-[#6d4a31] hover:to-[#a66a25] transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    disabled={items.length >= 6 || !newItem.trim()}
                  >
                    {items.length >= 6 ? '최대 6개까지 가능' : '고민 추가하기'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* 결과 표시 */}
        {winner && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-4">참견도치가 선택했어요!</h3>
            <div className="text-2xl font-bold text-[#ff6b35] bg-orange-50 rounded-lg p-4 border border-orange-100">
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
    </div>
  );
};

export default GamePage;
