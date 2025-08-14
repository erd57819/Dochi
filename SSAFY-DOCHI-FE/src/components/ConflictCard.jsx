import React from "react";
import conflictImage from '../assets/conflict.png'; // conflict.png 이미지 import

const HedgehogIcon = () => (
  <div className="w-[50px] h-[50px] mt-[12px] border-[3px] border-[#8B5A3C] overflow-hidden flex items-center justify-center shadow-xl" style={{background: 'linear-gradient(135deg, #F2EDE2 0%, #E0D7C9 100%)'}}>
    <img 
      src={conflictImage} 
      alt="갈등" 
      className="w-full h-full object-contain p-2 opacity-80"
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
      className={`w-[240px] h-[320px] bg-white/95 backdrop-blur-sm flex flex-col items-center pt-8 transition-all duration-500 cursor-pointer relative overflow-hidden border-l-4 ${
        isSelected ? 'border-[#5C351A] ring-2 ring-[#8B5A3C] ring-opacity-40' : 'border-[#D6CDB8]'
      }`}
      style={{
        boxShadow: isSelected 
          ? '0 12px 40px rgba(92, 53, 26, 0.25), 0 6px 20px rgba(139, 90, 60, 0.2)'
          : '0 8px 32px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
        transform: isSelected ? 'scale(1.03) translateY(-8px)' : 'scale(1)',
        background: isSelected 
          ? 'linear-gradient(145deg, #FEFCF8 0%, #F2EDE2 100%)' 
          : 'linear-gradient(145deg, #FEFCF8 0%, #F8F5F0 100%)'
      }}
      onClick={onButtonClick}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 12px 35px rgba(139, 90, 60, 0.15), 0 6px 18px rgba(92, 53, 26, 0.1)';
          e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)';
          e.currentTarget.style.borderLeftColor = '#8B5A3C';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)';
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderLeftColor = '#D6CDB8';
        }
      }}>
      
      {/* 갈등 이미지 아이콘 */}
      <HedgehogIcon />
      
      {/* 날짜 또는 갈등 등록일 텍스트 */}
      {!isEmptyCard && (
        <div className="mt-6 text-xs text-[#6B5B5B] bg-[#F2EDE2] px-4 py-2 border border-[#E0D7C9]" style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}>
          {date || "갈등 등록일"}
        </div>
      )}
      
      {/* 메인 텍스트 */}
      <div className={`${isEmptyCard ? 'mt-8' : 'mt-6'} text-center font-semibold leading-[1.4] px-6`} 
           style={{ 
             fontFamily: 'Pretendard-SemiBold, Helvetica',
             color: '#2A2A2A',
             fontSize: isEmptyCard ? '18px' : '16px',
             letterSpacing: '-0.02em'
           }}>
        {isEmptyCard ? (
          <>아직 등록된<br />갈등이 없어요</>
        ) : (
          title.length > 24 ? `${title.substring(0, 24)}...` : title
        )}
      </div>
      
      {/* 갈등 타입 표시 (빈 카드가 아닐 때만) */}
      {!isEmptyCard && (
        <div className="mt-4 text-xs text-[#5C351A] bg-[#EAE3D8] px-3 py-2 border border-[#D6CDB8]" style={{ fontFamily: 'Pretendard-Medium, Helvetica' }}>
          갈등 분석 완료
        </div>
      )}
      
      {/* 중앙 선 (ConflictReportPage 스타일) */}
      <div className="w-12 h-0.5 bg-[#8B5A3C] mt-6 mb-6"></div>
      
      {/* 버튼 */}
      <div className="mt-auto mb-8">
        <button 
          onClick={onButtonClick}
          className="px-6 py-3 text-sm font-medium transition-all duration-300 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
          style={{ 
            fontFamily: 'Pretendard-Medium, Helvetica',
            background: isSelected 
              ? 'linear-gradient(135deg, #5C351A 0%, #8B5A3C 100%)' 
              : 'linear-gradient(135deg, #8B5A3C 0%, #6B4226 100%)',
            border: 'none',
            letterSpacing: '-0.01em'
          }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default ConflictCard;
