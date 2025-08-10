import React from 'react';

const Step2ConflictDetail = ({ formData, onChange, onNext, onPrev }) => {
  const handleTitleChange = (e) => {
    const value = e.target.value;
    onChange({ title: value });
  };

  const handleDescChange = (e) => {
    const value = e.target.value;
    onChange({ description: value });
  };

  const frequencyOptions = [
    { value: 1, label: '1일 이내', emoji: '🌅' },
    { value: 7, label: '1주일 이내', emoji: '📅' },
    { value: 30, label: '1개월 이내', emoji: '🗓️' },
    { value: 90, label: '3개월 이내', emoji: '📆' },
    { value: 180, label: '6개월 이내', emoji: '📊' },
    { value: 365, label: '1년 이상', emoji: '🗂️' }
  ];

  const isValid = formData.title.trim() !== '' && formData.description.trim() !== '' && formData.conflictWhen && (formData.conflictFrequency || 1);

  return (
    <div className="animate-fadeIn">
      

      <div className="space-y-8">
        {/* 갈등 대상 */}
        <div>
          <label className="block text-xl font-semibold text-gray-700 mb-4">
            갈등 대상
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleTitleChange}
            placeholder="어떤 사람과 갈등이 있었는지 작성해주세요"
            className="w-full px-6 py-4 bg-white border-2 border-gray-200 rounded-xl
              transition-all duration-200 text-base text-gray-800
              focus:border-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-100"
          />
        </div>

        {/* 갈등 설명 */}
        <div>
          <label className="block text-xl font-semibold text-gray-700 mb-4">
            갈등 설명
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleDescChange}
            rows={6}
            placeholder="상황, 이유, 원인 등을 자세히 작성해주세요"
            className="w-full px-6 py-4 bg-white border-2 border-gray-200 rounded-xl
              transition-all duration-200 text-base text-gray-800 resize-none
              focus:border-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-100"
          />
        </div>

        {/* 갈등 발생 시점 */}
        <div>
          <label className="block text-xl font-semibold text-gray-700 mb-4">
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
                    ? 'border-amber-700 bg-amber-50 shadow-md transform scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="text-3xl mb-2">{option.emoji}</div>
                <div className="font-medium text-base">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 갈등 빈도 */}
        <div>
          <label className="block text-xl font-semibold text-gray-700 mb-4">
            갈등 빈도
          </label>
          <div className="bg-gray-50 p-6 rounded-2xl">
            <div className="relative">
              <input
                type="range"
                min="1"
                max="6"
                value={formData.conflictFrequency || 1}
                onChange={(e) => onChange({ conflictFrequency: parseInt(e.target.value) })}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #8B4513 0%, #8B4513 ${(((formData.conflictFrequency || 1) - 1) / 5) * 100}%, #e5e7eb ${(((formData.conflictFrequency || 1) - 1) / 5) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between mt-3 text-sm text-gray-600">
                <span>매일</span>
                <span>주 3-4회</span>
                <span>주 1-2회</span>
                <span>2주에 한번</span>
                <span>1달에 한번</span>
                <span>6달에 한번</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <span className="text-3xl font-bold" style={{color: '#8B4513'}}>
                {[
                  '',
                  '매일',
                  '주 3-4회', 
                  '주 1-2회',
                  '2주에 한번',
                  '1달에 한번',
                  '6달에 한번'
                ][formData.conflictFrequency || 1]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center mb-32">
        <button
          onClick={onPrev}
          type="button"
          className="text-gray-500 hover:text-gray-700 transition-colors text-sm cursor-pointer px-4 py-2 bg-transparent border-none"
        >
          ← 이전으로
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          style={{
            backgroundColor: isValid ? '#8B4513' : '#9CA3AF',
            color: isValid ? '#FFFFFF' : '#F3F4F6',
            padding: '0.75rem 2rem',
            borderRadius: '0.75rem',
            fontWeight: '500',
            cursor: isValid ? 'pointer' : 'not-allowed',
            border: 'none',
            boxShadow: isValid ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (isValid) {
              e.target.style.backgroundColor = '#654321';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
            }
          }}
          onMouseLeave={(e) => {
            if (isValid) {
              e.target.style.backgroundColor = '#8B4513';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
            }
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
          border: 3px solid #8B4513;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: white;
          border: 3px solid #8B4513;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: none;
        }
      `}</style>
    </div>
  );
};

export default Step2ConflictDetail;
