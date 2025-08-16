import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative" style={{ zoom: '0.85' }}>
      <div className="absolute inset-0">
        <div 
          className="absolute top-0 left-0 w-full" 
          style={{ 
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(255, 206, 157, 1), white)',
            opacity: 0.14
          }}
        ></div>
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: '#bf7d2c' }}></div>
          <p className="text-xl font-medium" style={{ color: '#333333' }}>연결 중...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;