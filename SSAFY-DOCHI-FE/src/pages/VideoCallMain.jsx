import React, { useState } from 'react';
import { videoCallApi } from '../services/videoCallApi';
import VideoCallRoom from './VideoCallRoom';

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

  // 통화 종료 후 메인으로 돌아가기
  const handleEndCall = () => {
    setCurrentPage('main');
    setRoomCode('');
    setJoinCode('');
    setRoomInfo(null);
    setError('');
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        {/* 메인 화면 */}
        {currentPage === 'main' && (
          <>
            <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
              영상통화
            </h1>
            
            <div className="space-y-4">
              <button
                onClick={() => setCurrentPage('create')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                새 방 만들기
              </button>
              
              <button
                onClick={() => setCurrentPage('join')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                방 참여하기
              </button>
            </div>
          </>
        )}

        {/* 방 생성 화면 */}
        {currentPage === 'create' && (
          <>
            <h2 className="text-xl font-bold text-center mb-6 text-gray-800">
              새 방 만들기
            </h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">안내</h3>
                <ul className="text-sm text-blue-700 space-y-1">
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
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                {loading ? '방 생성 중...' : '방 생성하기'}
              </button>
              
              <button
                onClick={() => setCurrentPage('main')}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                뒤로가기
              </button>
            </div>
          </>
        )}

        {/* 방 참여 화면 */}
        {currentPage === 'join' && (
          <>
            <h2 className="text-xl font-bold text-center mb-6 text-gray-800">
              방 참여하기
            </h2>
            
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center text-lg"
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
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                {loading ? '참여 중...' : '방 참여하기'}
              </button>
              
              <button
                onClick={() => {
                  setCurrentPage('main');
                  setJoinCode('');
                  setError('');
                }}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                뒤로가기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoCallMain;