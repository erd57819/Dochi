import React from "react";
import conflictImage from '../assets/conflict.png'; // conflict.png 이미지 import

const HedgehogIcon = () => (
  <div className="w-[40px] h-[40px] mt-[8px] rounded-full border-[2px] border-[#fbbf24] overflow-hidden flex items-center justify-center shadow-lg" style={{background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}}>
    <img 
      src={conflictImage} 
      alt="갈등" 
      className="w-full h-full object-contain p-1.5"
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
      className={`w-[220px] h-[280px] rounded-[16px] bg-white flex flex-col items-center pt-5 transition-all duration-300 cursor-pointer relative overflow-hidden ${
        isSelected ? 'ring-4 ring-orange-400 ring-opacity-70' : ''
      }`}
      style={{
        boxShadow: isSelected 
          ? '0 8px 32px rgba(255, 165, 0, 0.4), 0 4px 16px rgba(255, 165, 0, 0.3)'
          : '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)',
        transform: isSelected ? 'scale(1.05) translateY(-4px)' : 'scale(1)',
        background: isSelected 
          ? 'linear-gradient(145deg, #fff7ed 0%, #fed7aa 100%)' 
          : 'linear-gradient(145deg, #ffffff 0%, #fafafa 100%)'
      }}
      onClick={onButtonClick}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 165, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)';
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}>
      
      {/* 갈등 이미지 아이콘 */}
      <HedgehogIcon />
      
      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-100 to-transparent rounded-bl-full opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-yellow-100 to-transparent rounded-tr-full opacity-30"></div>
      
      {/* 날짜 또는 갈등 등록일 텍스트 */}
      {!isEmptyCard && (
        <div className="mt-3 text-xs text-[#888888] bg-gray-100 px-3 py-1 rounded-full" style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}>
          {date || "갈등 등록일"}
        </div>
      )}
      
      {/* 메인 텍스트 */}
      <div className={`${isEmptyCard ? 'mt-4' : 'mt-3'} text-center font-bold leading-[1.3] px-4`} 
           style={{ 
             fontFamily: 'Pretendard-Bold, Helvetica',
             background: 'linear-gradient(135deg, #FF6C50 0%, #FFC269 100%)',
             WebkitBackgroundClip: 'text',
             WebkitTextFillColor: 'transparent',
             backgroundClip: 'text',
             fontSize: isEmptyCard ? '16px' : '15px'
           }}>
        {isEmptyCard ? (
          <>아직 등록된<br />갈등이 없어요</>
        ) : (
          title.length > 20 ? `${title.substring(0, 20)}...` : title
        )}
      </div>
      
      {/* 갈등 타입 표시 (빈 카드가 아닐 때만) */}
      {!isEmptyCard && (
        <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-200">
          갈등 상황
        </div>
      )}
      
      {/* 버튼 */}
      <div className="mt-auto mb-6">
        <button 
          onClick={onButtonClick}
          className="px-4 py-2 rounded-full text-xs font-medium transition-all shadow-md text-white hover:shadow-lg transform hover:scale-105"
          style={{ 
            fontFamily: 'Pretendard-Medium, Helvetica',
            background: isSelected ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)' : 'linear-gradient(135deg, #EC9109 0%, #d67e05 100%)',
            border: 'none'
          }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default ConflictCard;
