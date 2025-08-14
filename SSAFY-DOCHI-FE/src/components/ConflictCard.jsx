import React from "react";
import conflictImage from '../assets/conflict.png'; // conflict.png 이미지 import

const HedgehogIcon = () => (
  <div className="w-[50px] h-[50px] mt-[12px] border-[3px] border-[#cc5500] rounded-full overflow-hidden flex items-center justify-center shadow-xl" style={{background: 'linear-gradient(135deg, #ff8c42 0%, #e67e22 100%)'}}>
    <img 
      src={conflictImage} 
      alt="갈등" 
      className="w-full h-full object-contain p-2 opacity-90"
    />
  </div>
);

const ConflictCard = ({ 
  type = "normal", // "normal", "empty"
  date = null,
  title = "집안일 분담\n관련 갈등",
  buttonText = "자세히 보기",
  onButtonClick = () => {},
  isSelected = false,
  isEditMode = false
}) => {
  const isEmptyCard = type === "empty";
  
  return (
    <div 
      className={`w-[240px] h-[320px] bg-white/95 backdrop-blur-sm flex flex-col transition-all duration-500 cursor-pointer relative overflow-hidden border-l-4 rounded-2xl ${
        isSelected ? 'border-[#bf7d2c] ring-2 ring-[#cd9f6e] ring-opacity-40' : 'border-[#f8d6b3]'
      }`}
      style={{
        boxShadow: isSelected 
          ? '0 12px 40px rgba(191, 125, 44, 0.25), 0 6px 20px rgba(205, 159, 110, 0.2)'
          : '0 8px 32px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
        transform: isSelected ? 'scale(1.03) translateY(-8px)' : 'scale(1)',
        background: isSelected 
          ? 'linear-gradient(145deg, #fffef9 0%, #f8d6b3 100%)' 
          : 'linear-gradient(145deg, #fffef9 0%, #fdf4e8 100%)'
      }}
      onClick={onButtonClick}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 12px 35px rgba(205, 159, 110, 0.15), 0 6px 18px rgba(191, 125, 44, 0.1)';
          e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)';
          e.currentTarget.style.borderLeftColor = '#bf7d2c';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)';
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderLeftColor = '#f8d6b3';
        }
      }}>
      
      {/* 상단 콘텐츠 영역 */}
      <div className="flex flex-col items-center pt-8 flex-1">
        {/* 갈등 이미지 아이콘 */}
        <HedgehogIcon />
        
        {/* 날짜 또는 갈등 등록일 텍스트 */}
        {!isEmptyCard && (
          <div className="mt-6 text-xs text-[#8B6914] " style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}>
            {date || "갈등 등록일"}
          </div>
        )}
        
        {/* 메인 텍스트 */}
        <div className={`${isEmptyCard ? 'mt-8' : 'mt-6'} text-center font-semibold leading-[1.4] px-6 flex-1 flex items-center justify-center`} 
             style={{ 
               fontFamily: 'Pretendard-SemiBold, Helvetica',
               color: '#2A2A2A',
               fontSize: isEmptyCard ? '18px' : '16px',
               letterSpacing: '-0.02em'
             }}>
          {isEmptyCard ? (
            <>아직 등록된<br />갈등이 없어요</>
          ) : (
            <div style={{ 
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '1.4'
            }}>
              {title}
            </div>
          )}
        </div>
        
        {/* 갈등 타입 표시 */}
        {!isEmptyCard && (
          <div className="mt-4 text-xs text-white bg-[#bf7d2c] hover:bg-[#a66a25] px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer" style={{ fontFamily: 'Pretendard-Medium, Helvetica' }}>
            자세히 보기
          </div>
        )}
        
        {/* 중앙 선 (MainPage 스타일) */}
        <div className="w-12 h-0.5 bg-[#bf7d2c] mt-6 rounded-full"></div>
      </div>
      
    </div>
  );
};

export default ConflictCard;
