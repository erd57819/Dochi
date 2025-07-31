import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoCallWithVoice from '../components/VideoCallWithVoice';

const VideoRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(`user_${Date.now()}`);

  if (!roomId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">잘못된 접근</h2>
          <p className="text-gray-600 mb-4">올바른 방 코드가 필요합니다.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <VideoCallWithVoice 
      roomCode={roomId} 
      userId={userId}
    />
  );
};

export default VideoRoomPage;