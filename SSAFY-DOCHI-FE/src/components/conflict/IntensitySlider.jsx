import React from 'react';

const IntensitySlider = ({ value, onChange }) => {
  const getColorClass = (val) => {
    if (val <= 3) return 'bg-green-500';
    if (val <= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getEmoji = (val) => {
    if (val <= 2) return '😌';
    if (val <= 4) return '😐';
    if (val <= 6) return '😕';
    if (val <= 8) return '😣';
    return '😡';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getEmoji(value)}</span>
          <div>
            <div className="text-lg font-semibold">갈등 강도: {value}/10</div>
            <div className="text-sm text-gray-500">
              {value <= 3 && '약한 갈등'}
              {value > 3 && value <= 6 && '보통 갈등'}
              {value > 6 && '심각한 갈등'}
            </div>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full ${getColorClass(value)} text-white font-bold`}>
          {value}
        </div>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, ${getColorClass(value).replace('bg-', '#')} 0%, ${getColorClass(value).replace('bg-', '#')} ${(value - 1) * 10}%, #e5e7eb ${(value - 1) * 10}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between mt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <div
              key={num}
              className={`text-xs ${value === num ? 'font-bold text-orange-600' : 'text-gray-400'}`}
            >
              {num}
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: white;
          border: 3px solid ${getColorClass(value).replace('bg-', '#')};
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: white;
          border: 3px solid ${getColorClass(value).replace('bg-', '#')};
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
};

export default IntensitySlider;
