import React, { useState, useEffect } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { videoCallApi } from '../services/videoCallApi';

const VideoCallRoom = ({ roomCode, userId, isHost, onEndCall }) => {
  const [roomInfo, setRoomInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const {
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    isConnected,
    isVideoEnabled,
    isAudioEnabled,
    connectionState,
    startCall,
    toggleVideo,
    toggleAudio,
    endCall
  } = useWebRTC(roomCode, userId);

  // 방 정보 가져오기
  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const response = await videoCallApi.getRoomInfo(roomCode);
        setRoomInfo(response.data);
        setLoading(false);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        setError('방 정보를 가져올 수 없습니다.');
        setLoading(false);
      }
    };

    if (roomCode) {
      fetchRoomInfo();
    }
  }, [roomCode]);

  // 호스트일 때 상대방이 들어오면 통화 시작
  useEffect(() => {
    if (isHost && roomInfo && roomInfo.guestUserId && localStream) {
      startCall();
    }
  }, [isHost, roomInfo, localStream, startCall]);

  // 통화 종료 처리
  const handleEndCall = async () => {
    try {
      await videoCallApi.endCall(roomCode);
      endCall();
      onEndCall();
    } catch (error) {
      console.error('통화 종료 실패:', error);
      endCall();
      onEndCall();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">방 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* 헤더 */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="text-white">
          <h2 className="text-xl font-bold">영상통화방: {roomCode}</h2>
          <p className="text-sm text-gray-300">
            상태: {connectionState} 
            {!isConnected && roomInfo?.guestUserId && ' - 연결 중...'}
            {!roomInfo?.guestUserId && ' - 상대방을 기다리는 중...'}
          </p>
        </div>
        <div className="text-white text-sm">
          참여자: {roomInfo?.hostUserId === userId ? '나' : '상대방'} 
          {roomInfo?.guestUserId && `, ${roomInfo?.guestUserId === userId ? '나' : '상대방'}`}
        </div>
      </div>

      {/* 비디오 영역 */}
      <div className="flex-1 flex">
        {/* 메인 비디오 (상대방) */}
        <div className="flex-1 relative bg-black">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white text-lg">
              {roomInfo?.guestUserId ? '상대방 비디오를 기다리는 중...' : '상대방이 들어오길 기다리는 중...'}
            </div>
          )}
          
          {/* 내 비디오 (PIP) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white text-sm">
                카메라 연결 중...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="bg-gray-800 p-4 flex justify-center space-x-4">
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${
            isVideoEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'
          } text-white transition-colors`}
          title={isVideoEnabled ? '비디오 끄기' : '비디오 켜기'}
        >
          {isVideoEnabled ? '📹' : '📹❌'}
        </button>

        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${
            isAudioEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'
          } text-white transition-colors`}
          title={isAudioEnabled ? '마이크 끄기' : '마이크 켜기'}
        >
          {isAudioEnabled ? '🎤' : '🎤❌'}
        </button>

        <button
          onClick={handleEndCall}
          className="p-3 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors"
          title="통화 종료"
        >
          📞❌
        </button>
      </div>

      {/* 초대 링크 표시 (호스트일 때만) */}
      {isHost && !roomInfo?.guestUserId && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 m-4 rounded">
          <h3 className="font-bold text-yellow-800">상대방 초대</h3>
          <p className="text-yellow-700 mb-2">
            아래 코드를 상대방에게 전달하세요:
          </p>
          <div className="bg-white p-2 rounded border border-yellow-300 font-mono text-lg text-center">
            {roomCode}
          </div>
          <p className="text-sm text-yellow-600 mt-2">
            또는 링크: {window.location.origin}/video-call/join/{roomCode}
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoCallRoom;