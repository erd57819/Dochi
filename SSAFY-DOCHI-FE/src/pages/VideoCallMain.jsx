import React, { useState } from 'react';
import { videoCallApi } from '../services/videoCallApi';
import VideoCallRoom from '../components/videocall/VideoCallRoom';

const VideoCallMain = () => {
  const [currentPage, setCurrentPage] = useState('main'); // 'main', 'create', 'join', 'room'
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  
  // 임시 사용자 ID (실제로는 JWT에서 가져와야 함)
  const userId = 1;

  // 방 생성
  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await videoCallApi.createRoom();
      setRoomInfo(response.data);
      setRoomCode(response.data.roomCode);
      setCurrentPage('room');
    } catch (error) {
      setError('방 생성에 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 방 참여
  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      setError('초대 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await videoCallApi.joinRoom(joinCode.trim().toUpperCase());
      setRoomInfo(response.data);
      setRoomCode(joinCode.trim().toUpperCase());
      setCurrentPage('room');
    } catch (error) {
      setError('방 참여에 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 통화 종료 후 갈등 레포트 페이지로 이동
  const handleEndCall = () => {
    // roomCode가 있으면 갈등 레포트 페이지로 이동
    if (roomCode) {
      // React Router의 navigate 사용
      window.location.href = `/conflict-report/${roomCode}`;
    } else {
      // roomCode가 없으면 메인으로
      setCurrentPage('main');
      setRoomCode('');
      setJoinCode('');
      setRoomInfo(null);
      setError('');
    }
  };

  // 영상통화방 화면
  if (currentPage === 'room' && roomCode) {
    return (
      <VideoCallRoom
        roomCode={roomCode}
        userId={userId}
        isHost={roomInfo?.hostUserId === userId}
        onEndCall={handleEndCall}
      />
    );
  }

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
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-md w-full p-6 border border-orange-100">
        {/* 메인 화면 */}
        {currentPage === 'main' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#BF7D2C' }}>
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v2.586A2 2 0 0113.414 8l3.293-3.293a1 1 0 011.414 1.414l-3 3a2 2 0 000 2.828l3 3a1 1 0 01-1.414 1.414L13.414 12A2 2 0 0112 11.414V14a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold" style={{ color: '#333333' }}>영상통화</h1>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => setCurrentPage('create')}
                className="w-full text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center space-x-3"
                style={{ backgroundColor: '#BF7D2C' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#8B4513'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#BF7D2C'}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>새 방 만들기</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('join')}
                className="w-full bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow flex items-center justify-center space-x-3"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
                <span>방 참여하기</span>
              </button>
            </div>
          </>
        )}

        {/* 방 생성 화면 */}
        {currentPage === 'create' && (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: '#BF7D2C' }}>
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-bold" style={{ color: '#333333' }}>새 방 만들기</h2>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-lg p-4" style={{ backgroundColor: '#faf8f5', border: '1px solid rgba(131, 103, 63, 0.15)' }}>
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 mr-2" style={{ color: '#BF7D2C' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <h3 className="font-semibold" style={{ color: '#BF7D2C' }}>안내</h3>
                </div>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 1대1 영상통화방이 생성됩니다</li>
                  <li>• 초대 코드를 상대방에게 전달하세요</li>
                  <li>• 방은 24시간 후 자동으로 만료됩니다</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: loading ? '#9CA3AF' : '#BF7D2C' }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#8B4513')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#BF7D2C')}
              >
                {loading ? '방 생성 중...' : '방 생성하기'}
              </button>
              
              <button
                onClick={() => setCurrentPage('main')}
                className="w-full bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl transition-all duration-200 shadow"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              >
                뒤로가기
              </button>
            </div>
          </>
        )}

        {/* 방 참여 화면 */}
        {currentPage === 'join' && (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: '#BF7D2C' }}>
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold" style={{ color: '#333333' }}>방 참여하기</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="joinCode" className="block text-sm font-medium text-gray-700 mb-2">
                  초대 코드
                </label>
                <input
                  type="text"
                  id="joinCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="예: ABC12345"
                  className="w-full px-3 py-3 rounded-xl font-mono text-center text-lg transition-all duration-200"
                  style={{ 
                    border: '2px solid rgba(131, 103, 63, 0.2)',
                    backgroundColor: '#faf8f5'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#BF7D2C'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(131, 103, 63, 0.2)'}
                  maxLength={8}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleJoinRoom}
                disabled={loading || !joinCode.trim()}
                className="w-full text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: (loading || !joinCode.trim()) ? '#9CA3AF' : '#BF7D2C' }}
                onMouseEnter={(e) => (!loading && joinCode.trim()) && (e.target.style.backgroundColor = '#8B4513')}
                onMouseLeave={(e) => (!loading && joinCode.trim()) && (e.target.style.backgroundColor = '#BF7D2C')}
              >
                {loading ? '참여 중...' : '방 참여하기'}
              </button>
              
              <button
                onClick={() => {
                  setCurrentPage('main');
                  setJoinCode('');
                  setError('');
                }}
                className="w-full bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl transition-all duration-200 shadow"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              >
                뒤로가기
              </button>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default VideoCallMain;