import React from 'react';

const ProgressIndicator = ({ currentStep, totalSteps = 5 }) => {
  const steps = [
    { number: 1, label: '갈등 유형' },
    { number: 2, label: '상황 설명' },
    { number: 3, label: '발생 시점' },
    { number: 4, label: '감정 상태' },
    { number: 5, label: 'AI 분석' }
  ];

  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`flex flex-col items-center ${
                index < steps.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div className="flex items-center w-full">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-300 z-10
                    ${currentStep >= step.number
                      ? 'bg-orange-500 text-white shadow-lg transform scale-110'
                      : 'bg-gray-200 text-gray-500'
                    }
                    ${currentStep === step.number ? 'ring-4 ring-orange-200' : ''}
                  `}
                >
                  {currentStep > step.number ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2">
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 transition-all duration-500 ease-out"
                        style={{
                          width: currentStep > step.number ? '100%' : '0%'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-2 text-xs font-medium text-center">
                <span className={currentStep >= step.number ? 'text-gray-800' : 'text-gray-400'}>
                  {step.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Current Step Info */}
      <div className="mt-6 text-center">
        <h3 className="text-lg font-semibold text-gray-800">
          {currentStep < totalSteps ? `${currentStep}/${totalSteps} 단계` : '완료!'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {currentStep === 1 && '어떤 갈등을 겪고 계신가요?'}
          {currentStep === 2 && '갈등 상황을 자세히 설명해주세요'}
          {currentStep === 3 && '언제, 얼마나 자주 발생하나요?'}
          {currentStep === 4 && '지금 어떤 감정을 느끼시나요?'}
          {currentStep === 5 && 'AI가 분석한 결과입니다'}
        </p>
      </div>
    </div>
  );
};

export default ProgressIndicator;
