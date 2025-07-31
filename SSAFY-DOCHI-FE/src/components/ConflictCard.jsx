import React from "react";

const HedgehogIcon = () => (
  <div className="w-[100px] h-[100px] mt-[60px] rounded-full border-[4px] border-[#fbbf24] overflow-hidden flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}}>
    <div className="flex space-x-[8px]">
      {/* 왼쪽 고슴도치 */}
      <div className="relative">
        <div className="w-[14px] h-[18px] bg-[#92400e] rounded-full relative">
          <div className="absolute top-[4px] left-[3px] w-[2px] h-[2px] bg-black rounded-full"></div>
          <div className="absolute top-[4px] right-[3px] w-[2px] h-[2px] bg-black rounded-full"></div>
          <div className="absolute -top-[2px] left-[1px] w-[2px] h-[6px] bg-[#78350f] rounded-t-full transform rotate-45"></div>
          <div className="absolute -top-[2px] left-[4px] w-[2px] h-[6px] bg-[#78350f] rounded-t-full transform -rotate-12"></div>
          <div className="absolute -top-[2px] right-[4px] w-[2px] h-[6px] bg-[#78350f] rounded-t-full transform rotate-12"></div>
          <div className="absolute -top-[2px] right-[1px] w-[2px] h-[6px] bg-[#78350f] rounded-t-full transform -rotate-45"></div>
        </div>
      </div>
      {/* 오른쪽 고슴도치 */}
      <div className="relative">
        <div className="w-[14px] h-[18px] bg-[#92400e] rounded-full relative">
          <div className="absolute top-[4px] left-[3px] w-[2px] h-[2px] bg-black rounded-full"></div>
          <div className="absolute top-[4px] right-[3px] w-[2px] h-[2px] bg-black rounded-full"></div>
          <div className="absolute -top-[2px] left-[1px] w-[2px] h-[6px] bg-[#78350f] rounded-t-full transform rotate-45"></div>
          <div className="absolute -top-[2px] left-[4px] w-[2px] h-[6px] bg-[#78350f] rounded-t-full transform -rotate-12"></div>
          <div className="absolute -top-[2px] right-[4px] w-[2px] h-[6px] bg-[#78350f] rounded-t-full transform rotate-12"></div>
          <div className="absolute -top-[2px] right-[1px] w-[2px] h-[6px] bg-[#78350f] rounded-t-full transform -rotate-45"></div>
        </div>
      </div>
    </div>
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
    <div className="w-full max-w-[362px] mx-auto h-[529px] rounded-[20px] border border-solid border-[#e5e7eb] bg-white shadow-[0px_4px_6px_rgba(0,0,0,0.1)] flex flex-col items-center">
      
      {/* 고슴도치 아이콘 */}
      <HedgehogIcon />
      
      {/* 날짜 또는 갈등 등록일 텍스트 */}
      {!isEmptyCard && (
        <div className="mt-10 text-lg text-[#999999]" style={{ fontFamily: 'Pretendard-Regular, Helvetica' }}>
          {date || "갈등 등록일"}
        </div>
      )}
      
      {/* 메인 텍스트 */}
      <div className={`${isEmptyCard ? 'mt-16' : 'mt-6'} text-center text-2xl font-bold text-[#ea580c] leading-[1.3]`} style={{ fontFamily: 'Pretendard-Bold, Helvetica' }}>
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
      <div className="mt-auto mb-[60px]">
        <button 
          onClick={onButtonClick}
          className="bg-[#ea580c] hover:bg-[#dc2626] text-white px-10 py-4 rounded-full text-lg font-medium transition-colors shadow-lg" 
          style={{ fontFamily: 'Pretendard-Medium, Helvetica' }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default ConflictCard;