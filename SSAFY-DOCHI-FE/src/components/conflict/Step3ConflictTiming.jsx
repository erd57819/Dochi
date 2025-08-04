import React from 'react';

const Step3ConflictTiming = ({ formData, onChange, onNext, onPrev }) => {
  const frequencyOptions = [
    { value: 1, label: '1일 이내', emoji: '🌅' },
    { value: 7, label: '1주일 이내', emoji: '📅' },
    { value: 30, label: '1개월 이내', emoji: '🗓️' },
    { value: 90, label: '3개월 이내', emoji: '📆' },
    { value: 180, label: '6개월 이내', emoji: '📊' },
    { value: 365, label: '1년 이상', emoji: '🗂️' }
  ];

  return (
    <div className="animate-fadeIn">
      {/* 이전 버튼 - 텍스트만 */}
      <div className="mb-6">
        <span
          onClick={onPrev}
          className="text-gray-500 hover:text-gray-700 transition-colors text-sm cursor-pointer"
        >
          ← 이전으로
        </span>
      </div>
      
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          갈등 발생 시기
        </h2>
        <p className="text-xl text-gray-600">
          갈등이 언제, 얼마나 자주 발생하는지 알려주세요
        </p>
      </div>

      <div className="space-y-8">
        {/* 갈등 발생 시점 */}
        <div>
          <label className="block text-2xl font-semibold text-gray-700 mb-6">
            갈등 발생 시점
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {frequencyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ conflictWhen: option.value })}
                className={`
                  p-6 rounded-xl border-2 transition-all duration-200
                  ${formData.conflictWhen === option.value
                    ? 'border-orange-500 bg-orange-50 shadow-md transform scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="text-4xl mb-3">{option.emoji}</div>
                <div className="font-medium text-lg">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 갈등 주기 */}
        <div>
          <label className="block text-2xl font-semibold text-gray-700 mb-6">
            갈등으로부터 지난 시간
          </label>
          <div className="bg-gray-50 p-6 rounded-2xl">
            <div className="relative">
              <input
                type="range"
                min="1"
                max="365"
                value={formData.conflictFrequency || 1}
                onChange={(e) => onChange({ conflictFrequency: parseInt(e.target.value) })}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${((formData.conflictFrequency || 1) / 365) * 100}%, #e5e7eb ${((formData.conflictFrequency || 1) / 365) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between mt-4 text-lg text-gray-600">
                <span>1일 이내</span>
                <span>어제</span>
                <span>3~4일 전</span>
                <span>지난 주</span>
                <span>지난 달</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <span className="text-4xl font-bold text-orange-600">
                {formData.conflictFrequency || 1}일 전
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end mb-32">
        <button
          onClick={onNext}
          style={{
            backgroundColor: '#F97316',
            color: '#FFFFFF',
            padding: '0.75rem 2rem',
            borderRadius: '0.75rem',
            fontWeight: '500',
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#EA580C';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#F97316';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
          }}
        >
          다음 단계로
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: white;
          border: 3px solid #f97316;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: white;
          border: 3px solid #f97316;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
};

export default Step3ConflictTiming;
