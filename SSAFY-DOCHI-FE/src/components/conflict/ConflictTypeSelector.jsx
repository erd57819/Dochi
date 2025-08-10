import React from 'react';

const conflictTypes = [
  { value: 'WORK', label: '직장 갈등', icon: '💼', description: '상사, 동료, 업무 관련' },
  { value: 'FAMILY', label: '가족 갈등', icon: '👨‍👩‍👧‍👦', description: '부모, 자녀, 형제자매' },
  { value: 'FRIEND', label: '친구 갈등', icon: '👥', description: '친구, 지인과의 문제' },
  { value: 'COUPLE', label: '연인 갈등', icon: '💏', description: '연인, 배우자와의 갈등' },
  { value: 'NEIGHBOR', label: '이웃 갈등', icon: '🏘️', description: '층간소음, 주차 등' },
  { value: 'FINANCIAL', label: '금전 갈등', icon: '💰', description: '돈 빌려줌, 비용 분담' },
  { value: 'ONLINE', label: '온라인 갈등', icon: '💻', description: 'SNS, 커뮤니티' },
  { value: 'ETC', label: '기타', icon: '🎲', description: '기타 갈등' }
];

const ConflictTypeSelector = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {conflictTypes.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => onChange(type.value)}
          style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
          className={`
            relative rounded-2xl border-2 transition-all duration-200 
            ${value === type.value 
              ? 'border-orange-500 bg-orange-50 shadow-lg transform scale-105' 
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }
          `}
        >
          <div className="text-3xl mb-2">{type.icon}</div>
          <div className="font-medium text-base">{type.label}</div>
          <div className="text-xs text-gray-500 mt-1">{type.description}</div>
          {value === type.value && (
            <div className="absolute top-2 right-2">
              <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default ConflictTypeSelector;
