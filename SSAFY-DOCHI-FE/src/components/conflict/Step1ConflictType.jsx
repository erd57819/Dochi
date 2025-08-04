import React from 'react';
import ConflictTypeSelector from './ConflictTypeSelector';

const Step1ConflictType = ({ formData, onChange, onNext }) => {
  const handleTypeSelect = (value) => {
    onChange({ conflictType: value });
    // 짧은 딜레이 후 다음 단계로 이동
    setTimeout(() => {
      onNext();
    }, 300);
  };

  return (
    <div className="animate-fade-in opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          어떤 갈등을 겪고 계신가요?
        </h2>
      </div>

      <ConflictTypeSelector
        value={formData.conflictType}
        onChange={handleTypeSelect}
      />
    </div>
  );
};

export default Step1ConflictType;