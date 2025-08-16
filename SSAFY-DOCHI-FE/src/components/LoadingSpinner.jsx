import React from 'react';
import loadingGif from '../assets/loading.gif';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = '#bf7d2c', 
  text = '', 
  type = 'gif' // 'gif', 'spinner', 'dots'
}) => {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20', 
    large: 'w-32 h-32',
    xlarge: 'w-40 h-40'
  };

  if (type === 'gif') {
    return (
      <div className="flex items-center justify-center gap-2">
        <img 
          src={loadingGif} 
          alt="Loading..." 
          className={sizeClasses[size]}
        />
        {text && <span className="text-sm" style={{ color }}>{text}</span>}
      </div>
    );
  }

  if (type === 'dots') {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="flex space-x-1">
          <div 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ backgroundColor: color }}
          ></div>
          <div 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              backgroundColor: color,
              animationDelay: '0.1s' 
            }}
          ></div>
          <div 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              backgroundColor: color,
              animationDelay: '0.2s' 
            }}
          ></div>
        </div>
        {text && <span className="text-sm" style={{ color }}>{text}</span>}
      </div>
    );
  }

  // Default spinner
  return (
    <div className="flex items-center justify-center gap-2">
      <div 
        className={`${sizeClasses[size]} border-2 border-t-transparent rounded-full animate-spin`}
        style={{ borderColor: `${color}30`, borderTopColor: color }}
      ></div>
      {text && <span className="text-sm" style={{ color }}>{text}</span>}
    </div>
  );
};

export default LoadingSpinner;