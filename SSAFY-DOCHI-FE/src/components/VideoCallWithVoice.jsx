import React, { useState, useEffect } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useVoiceProcessing } from '../hooks/useVoiceProcessing';

const VideoCallWithVoice = ({ roomCode, userId }) => {
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [voiceHistory, setVoiceHistory] = useState([]);
  
  // 기존 WebRTC 훅
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

  // 음성 처리 훅
  const {
    isRecording,
    isProcessing,
    isPlaying,
    transcript,
    responseText,
    error,
    audioRef,
    startRecording,
    stopRecording,
    speakText,
    clearError,
    clearResults
  } = useVoiceProcessing();

  // 음성 대화 기록 추가
  useEffect(() => {
    if (transcript && responseText) {
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        userSaid: transcript,
        aiResponse: responseText
      };
      setVoiceHistory(prev => [newEntry, ...prev.slice(0, 4)]); // 최근 5개만 유지
    }
  }, [transcript, responseText]);

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* 상단 헤더 */}
      <div className="flex justify-between items-center p-4 bg-gray-800 text-white">
        <h1 className="text-xl font-bold">화상 통화 - {roomCode}</h1>
        <div className="flex space-x-2">
          <span className={`px-3 py-1 rounded text-sm ${
            connectionState === 'connected' ? 'bg-green-600' : 
            connectionState === 'connecting' ? 'bg-yellow-600' : 'bg-red-600'
          }`}>
            {connectionState === 'connected' ? '연결됨' : 
             connectionState === 'connecting' ? '연결 중' : '연결 안됨'}
          </span>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-1">
        {/* 비디오 영역 */}
        <div className="flex-1 relative">
          {/* 원격 비디오 (메인) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover bg-gray-800"
          />
          
          {/* 로컬 비디오 (PIP) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          {/* 연결 상태 오버레이 */}
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-xl mb-4">상대방을 기다리는 중...</p>
                <button
                  onClick={startCall}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  통화 시작
                </button>
              </div>
            </div>
          )}

          {/* 컨트롤 바 */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-4 bg-black bg-opacity-50 rounded-full px-6 py-3">
              {/* 오디오 토글 */}
              <button
                onClick={toggleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                  isAudioEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isAudioEnabled ? '🎤' : '🔇'}
              </button>

              {/* 비디오 토글 */}
              <button
                onClick={toggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                  isVideoEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isVideoEnabled ? '📹' : '📹'}
              </button>

              {/* 음성 AI 토글 */}
              <button
                onClick={handleVoiceToggle}
                disabled={isProcessing}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                  isRecording ? 'bg-red-600 animate-pulse' : 
                  isProcessing ? 'bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isProcessing ? '⏳' : isRecording ? '⏹️' : '🤖'}
              </button>

              {/* 음성 패널 토글 */}
              <button
                onClick={() => setShowVoicePanel(!showVoicePanel)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-purple-600 hover:bg-purple-700"
              >
                💬
              </button>

              {/* 통화 종료 */}
              <button
                onClick={endCall}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-red-600 hover:bg-red-700"
              >
                📞
              </button>
            </div>
          </div>
        </div>

        {/* 음성 AI 패널 */}
        {showVoicePanel && (
          <div className="w-80 bg-white border-l border-gray-300 flex flex-col">
            {/* 패널 헤더 */}
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-800">🤖 음성 AI 어시스턴트</h3>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-50 border-b border-red-200">
                <div className="flex justify-between items-center">
                  <p className="text-red-700 text-sm">{error}</p>
                  <button onClick={clearError} className="text-red-400">✕</button>
                </div>
              </div>
            )}

            {/* 현재 상태 */}
            <div className="p-4 bg-blue-50 border-b">
              <div className="text-center">
                {isRecording && (
                  <p className="text-red-600 font-medium animate-pulse">
                    🔴 녹음 중...
                  </p>
                )}
                {isProcessing && (
                  <p className="text-blue-600 font-medium">
                    ⏳ 처리 중...
                  </p>
                )}
                {isPlaying && (
                  <p className="text-green-600 font-medium">
                    🔊 재생 중...
                  </p>
                )}
                {!isRecording && !isProcessing && !isPlaying && (
                  <p className="text-gray-600 text-sm">
                    🤖 버튼을 눌러 AI와 대화하세요
                  </p>
                )}
              </div>
            </div>

            {/* 대화 기록 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {voiceHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>아직 대화 기록이 없습니다.</p>
                  <p className="text-sm mt-2">음성 AI 버튼을 눌러 시작해보세요!</p>
                </div>
              ) : (
                voiceHistory.map(entry => (
                  <div key={entry.id} className="space-y-2">
                    {/* 사용자 발언 */}
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs text-blue-600 font-medium">당신</span>
                        <span className="text-xs text-gray-500">{entry.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-800">{entry.userSaid}</p>
                    </div>
                    
                    {/* AI 응답 */}
                    <div className="bg-green-100 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs text-green-600 font-medium">AI</span>
                        <button
                          onClick={() => speakText(entry.aiResponse)}
                          disabled={isProcessing || isPlaying}
                          className="text-xs text-green-600 hover:text-green-800 disabled:opacity-50"
                        >
                          🔊
                        </button>
                      </div>
                      <p className="text-sm text-gray-800">{entry.aiResponse}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex space-x-2">
                <button
                  onClick={handleVoiceToggle}
                  disabled={isProcessing}
                  className={`flex-1 py-2 px-4 rounded-lg text-white font-medium ${
                    isRecording ? 'bg-red-500 animate-pulse' : 
                    'bg-blue-500 hover:bg-blue-600'
                  } disabled:opacity-50`}
                >
                  {isRecording ? '녹음 중지' : '🎤 AI와 대화'}
                </button>
                <button
                  onClick={() => {
                    clearResults();
                    setVoiceHistory([]);
                  }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm"
                >
                  지우기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 숨겨진 오디오 엘리먼트 */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
};

export default VideoCallWithVoice;