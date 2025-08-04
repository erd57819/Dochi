import React from 'react';
import EmotionSelector from './EmotionSelector';
import IntensitySlider from './IntensitySlider';

const Step4EmotionState = ({ formData, onChange, onNext, onPrev }) => {
  return (
    <div className="animate-fade-in opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          내가 원하는 해결 결과
        </h2>
        <p className="text-gray-600">
          갈등이 어떻게 해결되기를 원하는지 알려주세요
        </p>
      </div>

      <div className="space-y-8">
        {/* 느껴던 감정 */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-4">
            느껴던 감정
          </label>
          <EmotionSelector
            value={formData.initialEmotion}
            onChange={(value) => onChange({ initialEmotion: value })}
          />
        </div>

        {/* 갈등 강도 */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-4">
            갈등의 강도 (1-10)
          </label>
          <IntensitySlider
            value={formData.intensity}
            onChange={(value) => onChange({ intensity: value })}
          />
        </div>

        {/* 갈등 해결 의지 */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-4">
            갈등 해결 방향
          </label>
          <textarea
            name="desiredOutcome"
            value={formData.desiredOutcome}
            onChange={(e) => onChange({ desiredOutcome: e.target.value })}
            rows={4}
            placeholder="어떤 방향으로 갈등을 해결하고 싶으세요?"
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl
              transition-all duration-200 text-gray-800 resize-none
              focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
          />
        </div>

        {/* 대화 의지 */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-4">
            대화 의지
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => onChange({ talkWillingness: 'YES' })}
              className={`
                p-4 rounded-xl border-2 transition-all duration-200
                ${formData.talkWillingness === 'YES'
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="text-2xl mb-2">😊</div>
              <div className="font-medium text-sm">있음</div>
            </button>
            <button
              type="button"
              onClick={() => onChange({ talkWillingness: 'MAYBE' })}
              className={`
                p-4 rounded-xl border-2 transition-all duration-200
                ${formData.talkWillingness === 'MAYBE'
                  ? 'border-yellow-500 bg-yellow-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="text-2xl mb-2">🤔</div>
              <div className="font-medium text-sm">보통</div>
            </button>
            <button
              type="button"
              onClick={() => onChange({ talkWillingness: 'NO' })}
              className={`
                p-4 rounded-xl border-2 transition-all duration-200
                ${formData.talkWillingness === 'NO'
                  ? 'border-red-500 bg-red-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="text-2xl mb-2">😔</div>
              <div className="font-medium text-sm">적극적</div>
            </button>
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
          AI 분석 시작
        </button>
      </div>
    </div>
  );
};

export default Step4EmotionState;