import React, { useState } from 'react';
import hedgehogImg from '../assets/image-65.png';
import todakImg from '../assets/todak.png';

const TutorialModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: "참견도치와 함께하는 갈등 해결",
      content: (
        <div className="text-center">
          <p className="text-lg mb-4 font-bold" style={{ color: '#333333' }}>
            안녕하세요! 저는 여러분의 갈등 해결을 도와드리는 참견도치예요.
          </p>
          <p style={{ color: '#666666' }}>
            어떤 고민이든 편하게 이야기해주세요. 함께 해결책을 찾아봐요!
          </p>
        </div>
      )
    },
    {
      title: "AI 모드 선택하기",
      content: (
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-lg mb-2 font-bold" style={{ color: '#ff3c3cff' }}>
              왼쪽 상단의 토글 버튼으로 참견도치의 모드를 바꿀 수 있어요!
            </p>
          </div>
          
          <div className="text-center">
            <h4 className="font-bold text-lg mb-1" style={{ color: '#333333' }}>입장정리 모드</h4>
            <p className="text-base" style={{ color: '#666666' }}>
              객관적으로 상황을 분석하고 나와 상대의 입장을 정리해 해결책을 제시해드려요.
            </p>
          </div>
          
          <div className="text-center">
            <h4 className="font-bold text-lg mb-1" style={{ color: '#333333' }}>내편들기 모드</h4>
            <p className="text-base" style={{ color: '#666666' }}>
              100% 여러분의 편에서 공감하고 위로해드려요.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "특별 기능 활용하기",
      content: (
        <div className="space-y-3">
          <div className="text-center">
            <h4 className="font-bold text-lg mb-1" style={{ color: '#333333' }}>네컷만화 생성</h4>
            <p className="text-base" style={{ color: '#666666' }}>
              참견도치와 대화 후, 대화 내용을 바탕으로 상황을 정리하는 4컷 만화를 그려드려요!
            </p>
          </div>
          
          <div className="text-center">
            <h4 className="font-bold text-lg mb-1" style={{ color: '#333333' }}>타임라인 분석</h4>
            <p className="text-base" style={{ color: '#666666' }}>
              참견도치와 대화 후, 대화 내용을 바탕으로 갈등 과정을 시간순으로 정리해드려요.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "이제 시작해볼까요?",
      content: (
        <div className="text-center">
          <p className="text-lg mb-6 font-bold" style={{ color: '#333333' }}>
            준비 완료! 이제 편하게 고민을 이야기해보세요.
          </p>
          <div className="mb-6">
            <p className="text-base mb-3" style={{ color: '#333333' }}>
              <strong>첫 메시지 예시:</strong>
            </p>
            <p className="text-base mb-2" style={{ color: '#666666' }}>
              "친구와 싸웠는데 어떻게 해야 할지 모르겠어요"
            </p>
            <p className="text-base" style={{ color: '#666666' }}>
              "직장에서 상사와 갈등이 있어서 스트레스받아요"
            </p>
          </div>
          <p className="text-sm" style={{ color: '#666666' }}>
            언제든 다시 보고 싶으시면 설정에서 '도움말'을 클릭하세요!
          </p>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    localStorage.setItem('dochi-tutorial-completed', 'true');
    onClose(); // 이제 onClose에서 ChatTitleModal을 열어줄 것
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* ComfortChatPage와 동일한 배경 구조 (ChatTitleModal 제외) */}
      <div className="relative bg-gradient-to-br from-orange-50 via-white to-yellow-50 overflow-hidden flex" style={{ height: '100vh' }}>
        {/* 배경 오버레이 */}
        <div className="absolute inset-0" style={{ opacity: 0.3 }}>
          <div 
            className="absolute top-0 left-0 w-full h-full"
            style={{ 
              background: 'linear-gradient(to bottom, rgb(248, 214, 179), white)',
              opacity: 0.5
            }}
          ></div>
        </div>
        
        {/* 사이드바 (데모용) */}
        <div className="bg-white shadow-lg w-[280px] flex flex-col" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          height: '100vh'
        }}>
          {/* 사이드바 헤더 */}
          <div className="p-3 flex-shrink-0">
            <button className="w-full flex items-center justify-center p-2 rounded-full h-10" style={{ 
              backgroundColor: 'transparent',
              color: '#8B4513'
            }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* 새 대화 버튼 */}
          <div className="px-3 pb-4 flex-shrink-0">
            <button className="w-full px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm border"
              style={{ 
                backgroundColor: 'transparent',
                borderColor: '#bf7d2c',
                color: '#8B4513'
              }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 대화
            </button>
          </div>

          {/* 세션 목록 (데모) */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
            <div className="p-4 mb-2" style={{ backgroundColor: '#f8d6b3' }}>
              <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-medium text-gray-800 truncate text-base">예시 대화</h3>
                  <p className="text-sm text-gray-500 mt-2 truncate">오늘</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 채팅 영역 */}
        <div className="flex-1 overflow-hidden relative" style={{ height: '100vh' }}>
          {/* 채팅 도구바 */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0 shadow-sm" 
               style={{ 
                 backgroundColor: 'rgba(255, 255, 255, 0.95)',
                 backdropFilter: 'blur(10px)',
                 padding: '12px 24px',
                 position: 'absolute',
                 top: '0',
                 left: '0',
                 right: '0',
                 zIndex: 10
               }}>
            {/* AI 모드 드롭다운 (데모용) */}
            <div className="relative">
              <button className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium border"
                style={{ 
                  backgroundColor: 'transparent',
                  borderColor: '#bf7d2c',
                  color: '#8B4513',
                  minWidth: '140px'
                }}>
                <span>입장정리</span>
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" style={{ stroke: '#8B4513' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              {/* 네컷만화 버튼 */}
              <button className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 border"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: '#8B4513',
                  color: '#8B4513'
                }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                네컷만화
              </button>

              {/* 타임라인 버튼 */}
              <button className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 border"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: '#bf7d2c',
                  color: '#bf7d2c'
                }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" style={{ stroke: '#bf7d2c' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                타임라인
              </button>
            </div>
          </div>

          {/* 메시지 영역 (데모용) */}
          <div className="relative"
               style={{ 
                 backgroundColor: 'rgba(254, 254, 254, 0.8)',
                 backdropFilter: 'blur(5px)',
                 padding: '8px',
                 paddingTop: '80px',
                 paddingBottom: '80px',
                 height: '100vh',
                 maxHeight: '100vh'
               }}>
            
            {/* 빈 대화 화면 */}
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p>대화를 시작해보세요</p>
              </div>
            </div>
          </div>

          {/* 입력 영역 */}
          <div className="border-t" 
               style={{ 
                 backgroundColor: 'rgba(255, 255, 255, 0.98)',
                 backdropFilter: 'blur(10px)',
                 borderColor: 'rgba(191, 125, 44, 0.1)',
                 padding: '12px',
                 position: 'absolute',
                 bottom: '0',
                 left: '0',
                 right: '0'
               }}>
            <div className="flex gap-2">
              <textarea
                placeholder="갈등 상황을 자세히 이야기해주세요..."
                className="flex-1 px-4 py-2 rounded-lg resize-none focus:outline-none bg-white shadow-sm"
                rows="1"
                readOnly
              />
              <button
                className="px-4 py-2 text-white rounded-lg"
                style={{ backgroundColor: '#d1d5db' }}>
                전송
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 하이라이트 요소들 */}
      {/* AI 모드 토글 하이라이트 */}
      {currentStep === 1 && (
        <div className="fixed z-70" style={{ top: '92px', left: '370px' }}>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-md font-semibold text-[#ff3c3cff] bg-[#ffffff] px-2 py-1 whitespace-nowrap" style={{ fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif' }}>
            여기서 AI 모드를 변경할 수 있습니다
          </div>
        </div>
      )}

      {/* 네컷만화 버튼 하이라이트 */}
      {currentStep === 2 && (
        <div className="fixed z-70" style={{ top: '92px', right: '200px' }}>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-md font-semibold text-[#ff3c3cff] bg-[#ffffff] px-2 py-1 whitespace-nowrap" style={{ fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif' }}>
            네컷만화 생성버튼
          </div>
        </div>
      )}

      {/* 타임라인 버튼 하이라이트 */}
      {currentStep === 2 && (
        <div className="fixed z-70" style={{ top: '92px', right: '70px' }}>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-md font-semibold text-[#ff3c3cff] bg-[#ffffff] px-2 py-1 whitespace-nowrap" style={{ fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif' }}>
            타임라인 분석버튼
          </div>
        </div>
      )}

      {/* 튜토리얼 모달 (정가운데) */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl max-w-lg w-full mx-4 shadow-xl z-60" style={{ zoom: '0.85' }}>
        {/* 헤더 */}
        <div className="p-8 relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 hover:opacity-70 transition-opacity"
            style={{ color: '#8B4513' }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img 
                src={hedgehogImg} 
                alt="참견도치" 
                className="w-36 h-36 object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#333333' }}>
              {tutorialSteps[currentStep].title}
            </h2>
          </div>
          
          {/* 진행 표시 */}
          <div className="flex justify-center mt-6 space-x-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentStep 
                    ? 'bg-brown-600' 
                    : index < currentStep 
                      ? 'bg-brown-400' 
                      : 'bg-gray-300'
                }`}
                style={{ 
                  backgroundColor: index === currentStep 
                    ? '#8B4513' 
                    : index < currentStep 
                      ? '#bf7d2c' 
                      : '#d1d5db'
                }}
              />
            ))}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="px-8 pb-2 flex flex-col justify-center">
          {tutorialSteps[currentStep].content}
        </div>

        {/* 푸터 */}
        <div className="px-8 pb-8 pt-2 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            이전
          </button>

          <span className="text-sm" style={{ color: '#666666' }}>
            {currentStep + 1} / {tutorialSteps.length}
          </span>

          {currentStep === tutorialSteps.length - 1 ? (
            <button
              onClick={handleClose}
              className="px-6 py-2 text-white rounded-lg transition-colors font-medium text-sm"
              style={{ backgroundColor: '#8B4513' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#bf7d2c')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#8B4513')}>
              시작하기
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="flex items-center px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm"
              style={{ backgroundColor: '#8B4513' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#bf7d2c')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#8B4513')}>
              다음
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;