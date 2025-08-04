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

  const cycleOptions = [
    { value: 0, label: '1일 이내', emoji: '☀️' },
    { value: 1, label: '매일', emoji: '🔄' },
    { value: 4, label: '3~4일', emoji: '📍' },
    { value: 7, label: '매주', emoji: '📋' },
    { value: 30, label: '매월', emoji: '📅' }
  ];

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          갈등 발생 시기
        </h2>
        <p className="text-gray-600">
          갈등이 언제, 얼마나 자주 발생하는지 알려주세요
        </p>
      </div>

      <div className="space-y-8">
        {/* 갈등 발생 시점 */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-4">
            갈등 발생 시점
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {frequencyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ conflictWhen: option.value })}
                className={`
                  p-4 rounded-xl border-2 transition-all duration-200
                  ${formData.conflictWhen === option.value
                    ? 'border-orange-500 bg-orange-50 shadow-md transform scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="text-2xl mb-2">{option.emoji}</div>
                <div className="font-medium text-sm">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 갈등 주기 */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-4">
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
              <div className="flex justify-between mt-4 text-sm text-gray-600">
                <span>1일 이내</span>
                <span>어제</span>
                <span>3~4일 전</span>
                <span>지난 주</span>
                <span>지난 달</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <span className="text-2xl font-bold text-orange-600">
                {formData.conflictFrequency || 1}일 전
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl
            hover:bg-gray-50 transition-all duration-200 font-medium"
        >
          이전으로
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-orange-500 text-white rounded-xl
            hover:bg-orange-600 shadow-lg hover:shadow-xl
            transform hover:-translate-y-0.5 transition-all duration-200 font-medium"
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
