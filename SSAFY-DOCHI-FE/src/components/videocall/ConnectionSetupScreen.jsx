import React from 'react';

const ConnectionSetupScreen = ({ 
  roomName, 
  participantName, 
  isGuestMode, 
  onStartConnection 
}) => {
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
      
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border border-orange-100 text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#333333' }}>화상 회의 준비</h2>
          <div className="mb-6">
            <p className="text-gray-600 mb-2">룸: <span className="font-semibold" style={{ color: '#bf7d2c' }}>{roomName}</span></p>
            <p className="text-gray-600">
              참가자: <span className="font-semibold" style={{ color: '#bf7d2c' }}>{isGuestMode ? `게스트 ${participantName}` : participantName}</span>
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={onStartConnection}
              className="w-full px-6 py-3 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
              style={{ backgroundColor: '#bf7d2c' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#8B4513'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#bf7d2c'}
            >
              미디어 테스트
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-gray-200 rounded-xl transition-all duration-200 shadow"
              style={{ color: '#333333' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#e5e7eb'}
            >
              나가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionSetupScreen;