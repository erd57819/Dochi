import React from 'react';

const GuestModal = ({ 
  guestNickname, 
  setGuestNickname, 
  onGuestJoin, 
  onLogin 
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      onGuestJoin();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(8px)' }}>
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4 border border-orange-100">
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#333333' }}>화상채팅 참여</h2>
        <p className="text-gray-600 mb-6">
          게스트로 참여하거나 로그인하여 참여할 수 있습니다.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="guestNickname" className="block text-sm font-medium mb-2" style={{ color: '#333333' }}>
              닉네임
            </label>
            <input
              type="text"
              id="guestNickname"
              value={guestNickname}
              onChange={(e) => setGuestNickname(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="닉네임을 입력하세요"
              className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200"
              style={{ 
                '--tw-ring-color': '#bf7d2c',
                focusRingColor: '#bf7d2c'
              }}
              autoFocus
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onGuestJoin}
              className="flex-1 text-white py-2 px-4 rounded-xl transition-all duration-200 shadow-lg font-medium"
              style={{ backgroundColor: '#bf7d2c' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#8B4513'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#bf7d2c'}
            >
              게스트로 참여
            </button>
            <button
              onClick={onLogin}
              className="flex-1 bg-gray-200 py-2 px-4 rounded-xl transition-all duration-200 shadow font-medium"
              style={{ color: '#333333' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#e5e7eb'}
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestModal;