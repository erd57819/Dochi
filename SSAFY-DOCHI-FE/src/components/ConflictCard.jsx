import React from "react";
import conflictImage from '../assets/conflict.png'; // conflict.png 이미지 import

const HedgehogIcon = () => (
  <div className="w-[52px] h-[52px] mt-[10px] rounded-full border-[2px] border-[#fbbf24] overflow-hidden flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}}>
    <img 
      src={conflictImage} 
      alt="갈등" 
      className="w-full h-full object-contain p-2"
    />
  </div>
);

const ConflictCard = ({ 
  type = "normal", // "normal", "empty"
  date = null,
  title = "집안일 분담\n관련 갈등",
  buttonText = "자세히 보기",
  onButtonClick = () => {}
}) => {
  const isEmptyCard = type === "empty";
  
  return (
    <div 
      className="w-[260px] h-[360px] rounded-[12px] bg-white flex flex-col items-center pt-8 transition-all duration-300 cursor-pointer" 
      style={{
        boxShadow: '0 0 15px rgba(255, 165, 0, 0.3), 0 0 30px rgba(255, 165, 0, 0.2), 0 0 45px rgba(255, 165, 0, 0.1)'
      }}
      onClick={onButtonClick}
      onMouseEnter={(e) => {
        e.target.style.boxShadow = '0 0 25px rgba(255, 165, 0, 0.5), 0 0 50px rgba(255, 165, 0, 0.4), 0 0 75px rgba(255, 165, 0, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.target.style.boxShadow = '0 0 15px rgba(255, 165, 0, 0.3), 0 0 30px rgba(255, 165, 0, 0.2), 0 0 45px rgba(255, 165, 0, 0.1)';
      }}>
      
      {/* 갈등 이미지 아이콘 */}
      <HedgehogIcon />
      
      {/* 날짜 또는 갈등 등록일 텍스트 */}
      {!isEmptyCard && (
        <div className="mt-4 text-sm text-[#999999]" style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}>
          {date || "갈등 등록일"}
        </div>
      )}
      
      {/* 메인 텍스트 */}
      <div className={`${isEmptyCard ? 'mt-6' : 'mt-2'} text-center text-lg font-bold leading-[1.2]`} 
           style={{ 
             fontFamily: 'Pretendard-Bold, Helvetica',
             background: 'linear-gradient(135deg, #FF6C50 0%, #FFC269 100%)',
             WebkitBackgroundClip: 'text',
             WebkitTextFillColor: 'transparent',
             backgroundClip: 'text'
           }}>
        {isEmptyCard ? (
          <>아직 등록된<br />갈등이 없어요</>
        ) : (
          title.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < title.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))
        )}
      </div>
      
      {/* 버튼 */}
      <div className="mt-auto mb-[50px]">
        <button 
          onClick={onButtonClick}
          className="px-5 py-2 rounded-full text-sm font-medium transition-colors shadow-lg text-white"
          style={{ 
            fontFamily: 'Pretendard-Medium, Helvetica',
            background: 'linear-gradient(135deg, #FF6C50 0%, #FFC269 100%)',
            border: 'none'
          }}
          onMouseEnter={(e) => e.target.style.background = 'linear-gradient(135deg, #E55A43 0%, #F0B85C 100%)'}
          onMouseLeave={(e) => e.target.style.background = 'linear-gradient(135deg, #FF6C50 0%, #FFC269 100%)'}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default ConflictCard;
