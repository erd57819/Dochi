import React from 'react';

const EmotionSelector = ({ emotions, value = [], onChange }) => {
  const emotionList = emotions || [
    { value: 'ANGER', label: '분노', icon: '😠' },
    { value: 'SADNESS', label: '슬픔', icon: '😢' },
    { value: 'FRUSTRATION', label: '좌절', icon: '😤' },
    { value: 'ANXIETY', label: '불안', icon: '😰' },
    { value: 'DISAPPOINTMENT', label: '실망', icon: '😞' },
    { value: 'JEALOUSY', label: '질투', icon: '😒' },
    { value: 'FEAR', label: '두려움', icon: '😨' },
    { value: 'ETC', label: '기타', icon: '🤔' }
  ];

  // 다중 선택 처리
  const handleEmotionClick = (emotionValue) => {
    const currentValues = Array.isArray(value) ? value : [value].filter(v => v);
    
    if (currentValues.includes(emotionValue)) {
      // 이미 선택된 경우 제거
      onChange(currentValues.filter(v => v !== emotionValue));
    } else {
      // 새로 선택
      onChange([...currentValues, emotionValue]);
    }
  };

  // 선택 여부 확인
  const isSelected = (emotionValue) => {
    const currentValues = Array.isArray(value) ? value : [value].filter(v => v);
    return currentValues.includes(emotionValue);
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">여러 개 선택 가능합니다</p>
      <div className="grid grid-cols-4 gap-4">
        {emotionList.map((emotion) => (
          <button
            key={emotion.value}
            type="button"
            onClick={() => handleEmotionClick(emotion.value)}
            className={`
              p-4 rounded-xl transition-all duration-200 border-2 relative
              ${isSelected(emotion.value)
                ? 'bg-amber-50 border-amber-700 shadow-md transform scale-105' 
                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }
            `}
          >
            {isSelected(emotion.value) && (
              <div className="absolute top-1 right-1">
                <div className="w-5 h-5 bg-amber-700 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
            <div className="text-2xl mb-1">{emotion.icon}</div>
            <div className="text-sm font-medium">{emotion.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmotionSelector;
