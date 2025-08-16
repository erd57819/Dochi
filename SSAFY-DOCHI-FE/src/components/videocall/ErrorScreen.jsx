import React from 'react';

const ErrorScreen = ({ error }) => {
  return (
    <div className="min-h-screen relative" style={{ 
      zoom: '0.85',
      background: 'linear-gradient(135deg, #f8d6b3 0%, #fff 50%, #f5f2ed 100%)'
    }}>
      <div className="absolute inset-0">
        <div 
          className="absolute top-0 left-0 w-full" 
          style={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #83673f 0%, #cd9f6e 50%, #EE9278 100%)',
            opacity: 0.08
          }}
        ></div>
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl text-center" style={{ border: '2px solid #f8d6b3' }}>
          <h2 className="text-2xl font-bold text-red-600 mb-4">연결 오류</h2>
          <p className="mb-6" style={{ color: '#666' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 text-white shadow-lg"
            style={{ backgroundColor: '#83673f' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#7F5539'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#83673f'}
          >
            다시 시도
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorScreen;