import React from 'react';
import ConflictTypeSelector from './ConflictTypeSelector';

const Step1ConflictType = ({ formData, onChange, onNext }) => {
  const isValid = formData.conflictType;

  return (
    <div className="animate-fade-in opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          갈등 유형을 골라주세요
        </h2>
        <p className="text-gray-600">
          어떤 사람과 갈등이 있으신지 직접 선택해주세요
        </p>
      </div>

      <ConflictTypeSelector
        value={formData.conflictType}
        onChange={(value) => onChange({ conflictType: value })}
      />

      <div className="mt-8 flex justify-end">
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
    </div>
  );
};

export default Step1ConflictType;