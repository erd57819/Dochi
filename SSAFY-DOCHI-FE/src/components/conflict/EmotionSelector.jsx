import React from 'react';

const EmotionSelector = ({ emotions, value, onChange }) => {
  const emotionList = emotions || [
    { value: 'ANGER', label: '분노', icon: '😠' },
    { value: 'SADNESS', label: '슬픔', icon: '😢' },
    { value: 'FRUSTRATION', label: '좌절', icon: '😤' },
    { value: 'FEAR', label: '불안', icon: '😰' },
    { value: 'DISAPPOINTMENT', label: '실망', icon: '😞' },
    { value: 'CONFUSION', label: '혼란', icon: '😵' },
    { value: 'HURT', label: '상처', icon: '💔' },
    { value: 'WORRY', label: '걱정', icon: '😟' },
    { value: 'STRESS', label: '스트레스', icon: '😫' },
    { value: 'LONELY', label: '외로움', icon: '😔' }
  ];

  return (
    <div className="grid grid-cols-5 gap-2">
      {emotionList.map((emotion) => (
        <button
          key={emotion.value}
          type="button"
          onClick={() => onChange(emotion.value)}
          className={`
            p-3 rounded-xl transition-all duration-200
            ${value === emotion.value 
              ? 'bg-orange-100 border-2 border-orange-500 shadow-md' 
              : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
            }
          `}
        >
          <div className="text-2xl mb-1">{emotion.icon}</div>
          <div className="text-xs font-medium">{emotion.label}</div>
        </button>
      ))}
    </div>
  );
};

export default EmotionSelector;
