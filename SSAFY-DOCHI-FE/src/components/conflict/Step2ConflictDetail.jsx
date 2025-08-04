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

  const isValid = formData.title.trim() !== '' && formData.description.trim() !== '' && formData.conflictWhen && formData.conflictFrequency;

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
          갈등 상황 설명하기
        </h2>
        <p className="text-xl text-gray-600">
          어떤 사람과 갈등이 있었는지 작성해주세요
        </p>
      </div>

      <div className="space-y-8">
        {/* 갈등 대상 */}
        <div>
          <label className="block text-2xl font-semibold text-gray-700 mb-6">
            갈등 대상
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleTitleChange}
            placeholder="어떤 사람과 갈등이 있었는지 작성해주세요"
            className="w-full px-6 py-4 bg-white border-2 border-gray-200 rounded-xl
              transition-all duration-200 text-lg text-gray-800
              focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
          />
        </div>

        {/* 갈등 설명 */}
        <div>
          <label className="block text-2xl font-semibold text-gray-700 mb-6">
            갈등 설명
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleDescChange}
            rows={6}
            placeholder="상황, 이유, 원인 등을 자세히 작성해주세요"
            className="w-full px-6 py-4 bg-white border-2 border-gray-200 rounded-xl
              transition-all duration-200 text-lg text-gray-800 resize-none
              focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
          />
        </div>

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

        {/* 갈등 빈도 */}
        <div>
          <label className="block text-2xl font-semibold text-gray-700 mb-6">
            갈등 빈도
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { value: 'DAILY', label: '매일', emoji: '🔥' },
              { value: 'WEEKLY_1_2', label: '주 1-2회', emoji: '📅' },
              { value: 'WEEKLY_3_4', label: '주 3-4회', emoji: '📊' },
              { value: 'BIWEEKLY', label: '2주에 한번', emoji: '📋' },
              { value: 'MONTHLY', label: '1달에 한번', emoji: '🗓️' },
              { value: 'HALF_YEARLY', label: '6달에 한번', emoji: '📆' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ conflictFrequency: option.value })}
                className={`
                  p-6 rounded-xl border-2 transition-all duration-200
                  ${formData.conflictFrequency === option.value
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
      </div>

      <div className="mt-8 flex justify-end mb-32">
        <button
          onClick={onNext}
          disabled={!isValid}
          style={{
            backgroundColor: isValid ? '#F97316' : '#9CA3AF',
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
              e.target.style.backgroundColor = '#EA580C';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
            }
          }}
          onMouseLeave={(e) => {
            if (isValid) {
              e.target.style.backgroundColor = '#F97316';
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
      `}</style>
    </div>
  );
};

export default Step2ConflictDetail;
