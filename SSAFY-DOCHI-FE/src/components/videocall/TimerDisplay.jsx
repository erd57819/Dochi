import React from 'react';

const TimerDisplay = ({ elapsedTime, formatTime }) => {
  return (
    <div className="text-center px-4">
      <div className="text-2xl font-bold text-[#5C351A]">
        {formatTime(elapsedTime).elapsed}
      </div>
      <div className={`text-sm ${
        elapsedTime >= 25 * 60 * 1000 ? 'text-red-500 animate-pulse' : 
        elapsedTime >= 20 * 60 * 1000 ? 'text-[#5C351A]' : 
        'text-[#4A4A4A]'
      }`}>
        {formatTime(elapsedTime).remaining}
      </div>
    </div>
  );
};

export default TimerDisplay;