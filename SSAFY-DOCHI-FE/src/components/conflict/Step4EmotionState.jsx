import React from 'react';
import EmotionSelector from './EmotionSelector';
import IntensitySlider from './IntensitySlider';

const Step4EmotionState = ({ formData, onChange, onNext, onPrev }) => {
  return (
    <div className="animate-fade-in opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
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
          내가 원하는 해결 결과
        </h2>
        <p className="text-xl text-gray-600">
          갈등이 어떻게 해결되기를 원하는지 알려주세요
        </p>
      </div>

      <div className="space-y-8">
        {/* 느껴던 감정 */}
        <div>
          <label className="block text-2xl font-semibold text-gray-700 mb-6">
            느껴던 감정
          </label>
          <EmotionSelector
            value={formData.initialEmotion}
            onChange={(value) => onChange({ initialEmotion: value })}
          />
        </div>

        {/* 갈등 강도 */}
        <div>
          <label className="block text-2xl font-semibold text-gray-700 mb-6">
            갈등의 강도 (1-10)
          </label>
          <IntensitySlider
            value={formData.intensity}
            onChange={(value) => onChange({ intensity: value })}
          />
        </div>

        {/* 갈등 해결 의지 */}
        <div>
          <label className="block text-2xl font-semibold text-gray-700 mb-6">
            갈등 해결 방향
          </label>
          <textarea
            name="desiredOutcome"
            value={formData.desiredOutcome}
            onChange={(e) => onChange({ desiredOutcome: e.target.value })}
            rows={4}
            placeholder="어떤 방향으로 갈등을 해결하고 싶으세요?"
            className="w-full px-6 py-4 bg-white border-2 border-gray-200 rounded-xl
              transition-all duration-200 text-lg text-gray-800 resize-none
              focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
          />
        </div>

        {/* 대화 의지 */}
        <div>
          <label className="block text-2xl font-semibold text-gray-700 mb-6">
            대화 의지
          </label>
          <div className="grid grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => onChange({ talkWillingness: 'YES' })}
              className={`
                p-6 rounded-xl border-2 transition-all duration-200
                ${formData.talkWillingness === 'YES'
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="text-4xl mb-3">😊</div>
              <div className="font-medium text-lg">있음</div>
            </button>
            <button
              type="button"
              onClick={() => onChange({ talkWillingness: 'MAYBE' })}
              className={`
                p-6 rounded-xl border-2 transition-all duration-200
                ${formData.talkWillingness === 'MAYBE'
                  ? 'border-yellow-500 bg-yellow-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="text-4xl mb-3">🤔</div>
              <div className="font-medium text-lg">보통</div>
            </button>
            <button
              type="button"
              onClick={() => onChange({ talkWillingness: 'NO' })}
              className={`
                p-6 rounded-xl border-2 transition-all duration-200
                ${formData.talkWillingness === 'NO'
                  ? 'border-red-500 bg-red-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="text-4xl mb-3">😔</div>
              <div className="font-medium text-lg">적극적</div>
            </button>
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
          AI 분석 시작
        </button>
      </div>
    </div>
  );
};

export default Step4EmotionState;
