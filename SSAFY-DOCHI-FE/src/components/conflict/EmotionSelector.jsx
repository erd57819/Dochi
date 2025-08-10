import React from 'react';

const EmotionSelector = ({ emotions, value, onChange }) => {
  const emotionList = emotions || [
    { value: 'ANGER', label: '분노', icon: '😠' },
    { value: 'SADNESS', label: '슬픔', icon: '😢' },
    { value: 'FRUSTRATION', label: '좌절', icon: '😤' },
    { value: 'ETC', label: '기타', icon: '🤔' }
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {emotionList.map((emotion) => (
        <button
          key={emotion.value}
          type="button"
          onClick={() => onChange(emotion.value)}
          className={`
            p-6 rounded-xl transition-all duration-200 border-2
            ${value === emotion.value 
              ? 'bg-amber-50 border-amber-700 shadow-md transform scale-105' 
              : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }
          `}
        >
          <div className="text-3xl mb-2">{emotion.icon}</div>
          <div className="text-base font-medium">{emotion.label}</div>
        </button>
      ))}
    </div>
  );
};

export default EmotionSelector;
