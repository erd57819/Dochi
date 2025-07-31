import React from "react";

const Element = () => {
  return (
    <div className="bg-[#ffffff] flex flex-row justify-center w-full">
      <div className="bg-[#ffffff] overflow-hidden w-[1440px] h-[1024px] relative">
        
        {/* 마이페이지 제목 */}
        <div className="absolute w-[227px] top-[80px] left-[606px] [font-family:'Pretendard-Bold',Helvetica] font-bold text-[36px] text-[#bf7d2c] text-center">
          마이페이지
        </div>

        {/* 네비게이션 메뉴 */}
        <div className="absolute top-[160px] left-[432px] [font-family:'Pretendard-SemiBold',Helvetica] font-semibold text-[20px] text-[#bf7d2c] border-b-[3px] border-[#bf7d2c] pb-[8px]">
          갈등 모아보기
        </div>

        <div className="absolute top-[160px] left-[643px] [font-family:'Pretendard-SemiBold',Helvetica] font-semibold text-[20px] text-[#999999]">
          내 정보 수정
        </div>

        <div className="absolute top-[160px] left-[834px] [font-family:'Pretendard-SemiBold',Helvetica] font-semibold text-[20px] text-[#999999]">
          비밀번호 변경
        </div>

        {/* 첫 번째 카드 */}
        <div className="absolute w-[362px] h-[529px] top-[250px] left-[123px] rounded-[20px] border border-solid border-[#e5e7eb] bg-white shadow-[0px_4px_6px_rgba(0,0,0,0.1)]">
          
          {/* 고슴도치 아이콘 */}
          <div className="absolute w-[100px] h-[100px] top-[60px] left-[131px] rounded-full border-[4px] border-[#fbbf24] overflow-hidden" style={{background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}}>
            <div className="absolute top-[30px] left-[35px] flex space-x-[8px]">
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
          
          {/* 갈등 등록일 텍스트 */}
          <div className="absolute top-[200px] left-[50%] transform -translate-x-1/2 [font-family:'Pretendard-Regular',Helvetica] text-[18px] text-[#999999]">
            갈등 등록일
          </div>
          
          {/* 메인 텍스트 */}
          <div className="absolute top-[250px] left-[50%] transform -translate-x-1/2 text-center [font-family:'Pretendard-Bold',Helvetica] font-bold text-[24px] text-[#ea580c] leading-[1.3]">
            집안일 분담<br />
            관련 갈등
          </div>
          
          {/* 버튼 */}
          <div className="absolute bottom-[60px] left-[50%] transform -translate-x-1/2">
            <button className="bg-[#ea580c] hover:bg-[#dc2626] text-white px-[40px] py-[16px] rounded-full [font-family:'Pretendard-Medium',Helvetica] text-[18px] font-medium transition-colors shadow-lg">
              자세히 보기
            </button>
          </div>
        </div>

        {/* 두 번째 카드 */}
        <div className="absolute w-[362px] h-[529px] top-[250px] left-[539px] rounded-[20px] border border-solid border-[#e5e7eb] bg-white shadow-[0px_4px_6px_rgba(0,0,0,0.1)]">
          
          {/* 고슴도치 아이콘 */}
          <div className="absolute w-[100px] h-[100px] top-[60px] left-[131px] rounded-full border-[4px] border-[#fbbf24] overflow-hidden" style={{background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}}>
            <div className="absolute top-[30px] left-[35px] flex space-x-[8px]">
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
          
          {/* 날짜 텍스트 */}
          <div className="absolute top-[200px] left-[50%] transform -translate-x-1/2 [font-family:'Pretendard-Regular',Helvetica] text-[18px] text-[#999999]">
            2025.05.05
          </div>
          
          {/* 메인 텍스트 */}
          <div className="absolute top-[250px] left-[50%] transform -translate-x-1/2 text-center [font-family:'Pretendard-Bold',Helvetica] font-bold text-[24px] text-[#ea580c] leading-[1.3]">
            집안일 분담<br />
            관련 갈등
          </div>
          
          {/* 버튼 */}
          <div className="absolute bottom-[60px] left-[50%] transform -translate-x-1/2">
            <button className="bg-[#ea580c] hover:bg-[#dc2626] text-white px-[40px] py-[16px] rounded-full [font-family:'Pretendard-Medium',Helvetica] text-[18px] font-medium transition-colors shadow-lg">
              자세히 보기
            </button>
          </div>
        </div>

        {/* 세 번째 카드 - 빈 상태 */}
        <div className="absolute w-[362px] h-[529px] top-[250px] left-[955px] rounded-[20px] border border-solid border-[#e5e7eb] bg-white shadow-[0px_4px_6px_rgba(0,0,0,0.1)]">
          
          {/* 고슴도치 아이콘 */}
          <div className="absolute w-[100px] h-[100px] top-[60px] left-[131px] rounded-full border-[4px] border-[#fbbf24] overflow-hidden" style={{background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}}>
            <div className="absolute top-[30px] left-[35px] flex space-x-[8px]">
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
          
          {/* 메인 텍스트 */}
          <div className="absolute top-[230px] left-[50%] transform -translate-x-1/2 text-center [font-family:'Pretendard-Bold',Helvetica] font-bold text-[24px] text-[#ea580c] leading-[1.3]">
            아직 등록된<br />
            갈등이 없어요
          </div>
          
          {/* 버튼 */}
          <div className="absolute bottom-[60px] left-[50%] transform -translate-x-1/2">
            <button className="bg-[#ea580c] hover:bg-[#dc2626] text-white px-[40px] py-[16px] rounded-full [font-family:'Pretendard-Medium',Helvetica] text-[18px] font-medium transition-colors shadow-lg">
              등록하러가기
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Element;