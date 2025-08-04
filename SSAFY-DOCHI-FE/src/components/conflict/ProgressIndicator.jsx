import React from 'react';

const ProgressIndicator = ({ currentStep, totalSteps = 4 }) => {
  const steps = [
    { number: 1, label: '갈등 유형' },
    { number: 2, label: '상황 설명' },
    { number: 3, label: '감정 상태' },
    { number: 4, label: 'AI 분석' }
  ];

  return (
    <div className="mb-4 flex justify-center">
      {/* Progress Bar */}
      <div className="relative max-w-4xl w-full">
        {/* 막대형 프로그레스바 */}
        <div className="mb-4">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 ease-out rounded-full"
              style={{
                width: `${(currentStep / totalSteps) * 100}%`,
                background: 'linear-gradient(108deg, rgba(191,125,44,1) 0%, rgba(139,69,19,1) 100%)'
              }}
            />
          </div>
        </div>
        
        {/* 단계 라벨들 */}
        <div className="flex justify-between text-xs">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`text-center ${
                currentStep >= step.number ? 'text-gray-700 font-medium' : 'text-gray-400'
              }`}
            >
              {step.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;
