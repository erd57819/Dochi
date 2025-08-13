import React, { useState } from 'react';

const TutorialModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: "참견도치와 함께하는 갈등 해결",
      content: (
        <div className="text-center">
          <div className="text-6xl mb-6">🦔</div>
          <p className="text-lg text-gray-700 mb-4">
            안녕하세요! 저는 여러분의 갈등 상황을 도와드리는 참견도치예요.
          </p>
          <p className="text-gray-600">
            어떤 고민이든 편하게 이야기해주세요. 함께 해결책을 찾아봐요!
          </p>
        </div>
      )
    },
    {
      title: "AI 모드 선택하기",
      content: (
        <div className="space-y-4">
          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h4 className="font-semibold text-orange-800">입장정리 모드</h4>
            </div>
            <p className="text-orange-700 text-sm">
              객관적으로 상황을 분석하고 실용적인 해결책을 제시해드려요.
            </p>
          </div>
          
          <div className="border border-pink-200 rounded-lg p-4 bg-pink-50">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-pink-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <h4 className="font-semibold text-pink-800">내편들기 모드</h4>
            </div>
            <p className="text-pink-700 text-sm">
              100% 여러분의 편에서 공감하고 위로해드려요.
            </p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              💡 <strong>팁:</strong> 처음엔 입장정리로 시작해서, 마음이 복잡할 때 내편들기로 바꿔보세요!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "특별 기능 활용하기",
      content: (
        <div className="space-y-4">
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h4 className="font-semibold text-blue-800">네컷만화 생성</h4>
            </div>
            <p className="text-blue-700 text-sm">
              대화 내용을 바탕으로 귀여운 4컷 만화를 그려드려요!
            </p>
          </div>
          
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="font-semibold text-green-800">타임라인 분석</h4>
            </div>
            <p className="text-green-700 text-sm">
              갈등 과정을 시간순으로 정리해드려요.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "이제 시작해볼까요?",
      content: (
        <div className="text-center">
          <div className="text-5xl mb-6">✨</div>
          <p className="text-lg text-gray-700 mb-4">
            준비 완료! 이제 편하게 고민을 이야기해보세요.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-orange-800 text-sm">
              <strong>첫 메시지 예시:</strong><br/>
              "친구와 싸웠는데 어떻게 해야 할지 모르겠어요"<br/>
              "직장에서 상사와 갈등이 있어서 스트레스받아요"
            </p>
          </div>
          <p className="text-gray-500 text-sm">
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
    onClose();
    localStorage.setItem('dochi-tutorial-completed', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
      <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
        {/* 헤더 */}
        <div className="bg-orange-500 text-white p-6 rounded-t-lg relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold">{tutorialSteps[currentStep].title}</h2>
          </div>
          
          {/* 진행 표시 */}
          <div className="flex justify-center mt-4 space-x-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep 
                    ? 'bg-white' 
                    : index < currentStep 
                      ? 'bg-white bg-opacity-60' 
                      : 'bg-white bg-opacity-30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 min-h-[320px] flex flex-col justify-center">
          {tutorialSteps[currentStep].content}
        </div>

        {/* 푸터 */}
        <div className="px-6 pb-6 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            이전
          </button>

          <span className="text-sm text-gray-500">
            {currentStep + 1} / {tutorialSteps.length}
          </span>

          {currentStep === tutorialSteps.length - 1 ? (
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              시작하기! 🚀
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
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