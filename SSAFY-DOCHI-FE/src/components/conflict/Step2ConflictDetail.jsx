import React, { useState } from 'react';

const Step2ConflictDetail = ({ formData, onChange, onNext, onPrev }) => {
  const [titleError, setTitleError] = useState('');
  const [descError, setDescError] = useState('');

  const handleTitleChange = (e) => {
    const value = e.target.value;
    onChange({ title: value });
    
    if (value.length < 5) {
      setTitleError('제목은 5자 이상 입력해주세요');
    } else {
      setTitleError('');
    }
  };

  const handleDescChange = (e) => {
    const value = e.target.value;
    onChange({ description: value });
    
    if (value.length < 20) {
      setDescError('상황은 20자 이상 자세히 설명해주세요');
    } else {
      setDescError('');
    }
  };

  const isValid = formData.title.length >= 5 && formData.description.length >= 20;

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          갈등 상황 설명하기
        </h2>
        <p className="text-gray-600">
          어떤 사람과 갈등이 있었는지 작성해주세요
        </p>
      </div>

      <div className="space-y-6">
        {/* 갈등 대상 */}
        <div className="bg-gray-50 p-6 rounded-2xl">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            갈등 대상
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleTitleChange}
            placeholder="어떤 사람과 갈등이 있었는지 작성해주세요"
            className={`
              w-full px-4 py-3 bg-white border-2 rounded-xl
              transition-all duration-200 text-gray-800
              ${titleError ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}
              focus:outline-none focus:ring-4 focus:ring-orange-100
            `}
          />
          {titleError && (
            <p className="mt-2 text-sm text-red-500 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {titleError}
            </p>
          )}
        </div>

        {/* 갈등 설명 */}
        <div className="bg-gray-50 p-6 rounded-2xl">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            갈등 설명
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleDescChange}
            rows={6}
            placeholder="상황, 이유, 원인 등을 자세히 작성해주세요"
            className={`
              w-full px-4 py-3 bg-white border-2 rounded-xl
              transition-all duration-200 text-gray-800 resize-none
              ${descError ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}
              focus:outline-none focus:ring-4 focus:ring-orange-100
            `}
          />
          <div className="mt-2 flex justify-between items-center">
            <div>
              {descError && (
                <p className="text-sm text-red-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {descError}
                </p>
              )}
            </div>
            <span className={`text-sm ${formData.description.length < 20 ? 'text-gray-400' : 'text-green-600'}`}>
              {formData.description.length}자
            </span>
          </div>
        </div>

        {/* 참여자 (선택사항) */}
        <div className="bg-gray-50 p-6 rounded-2xl">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            갈등 참여자 <span className="text-gray-400 font-normal">(선택사항)</span>
          </label>
          <input
            type="text"
            name="participants"
            value={formData.participants}
            onChange={(e) => onChange({ participants: e.target.value })}
            placeholder="갈등에 관련된 사람들 (예: 팀장, 동료 김씨)"
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl
              transition-all duration-200 text-gray-800
              focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
          />
          <p className="mt-2 text-xs text-gray-500">
            쉼표로 구분해서 여러 명을 입력할 수 있어요
          </p>
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
          disabled={!isValid}
          className={`
            px-8 py-3 rounded-xl font-medium transition-all duration-200
            ${isValid
              ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
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
