import React, { useState, useEffect } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSTTProcessing } from '../hooks/useSTTProcessing';

const VideoCallWithSTT = ({ roomCode, userId }) => {
  const [showSTTPanel, setShowSTTPanel] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  
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

  // STT 처리 훅
  const {
    isRecording,
    isProcessing,
    transcript,
    processingTime,
    analysisResult,
    error,
    recordWithAnalysis,
    toggleRecording,
    clearResults,
    clearError
  } = useSTTProcessing();

  // 대화 기록 추가
  useEffect(() => {
    if (transcript) {
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        speaker: userId,
        text: transcript,
        processingTime: processingTime,
        emotion: analysisResult?.emotion?.emotion || null,
        conflictRisk: analysisResult?.conflictRisk || null,
        suggestions: analysisResult?.suggestions || []
      };
      setConversationHistory(prev => [newEntry, ...prev.slice(0, 9)]); // 최근 10개만 유지
    }
  }, [transcript, analysisResult, processingTime, userId]);

  const handleSTTToggle = () => {
    if (isRecording) {
      toggleRecording(); // 중지
    } else {
      recordWithAnalysis(); // 분석과 함께 시작
    }
  };

  const getEmotionEmoji = (emotion) => {
    switch (emotion) {
      case 'happy': case 'positive': return '😊';
      case 'angry': case 'frustrated': return '😠';
      case 'sad': return '😢';
      case 'anxious': return '😰';
      default: return '😐';
    }
  };

  const getRiskEmoji = (risk) => {
    switch (risk) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '✅';
      default: return '➖';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* 상단 헤더 */}
      <div className="flex justify-between items-center p-4 bg-gray-800 text-white">
        <h1 className="text-xl font-bold">화상 통화 + STT - {roomCode}</h1>
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

              {/* STT 토글 */}
              <button
                onClick={handleSTTToggle}
                disabled={isProcessing}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                  isRecording ? 'bg-red-600 animate-pulse' : 
                  isProcessing ? 'bg-yellow-600' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isProcessing ? '⏳' : isRecording ? '⏹️' : '🎙️'}
              </button>

              {/* STT 패널 토글 */}
              <button
                onClick={() => setShowSTTPanel(!showSTTPanel)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700"
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

        {/* STT 패널 */}
        {showSTTPanel && (
          <div className="w-80 bg-white border-l border-gray-300 flex flex-col">
            {/* 패널 헤더 */}
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-800">🎙️ 음성인식 (STT)</h3>
              <p className="text-xs text-gray-600 mt-1">GMS API (Whisper-1)</p>
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
                    ⏳ Whisper-1 처리 중...
                  </p>
                )}
                {!isRecording && !isProcessing && (
                  <p className="text-gray-600 text-sm">
                    🎙️ 버튼을 눌러 음성인식 시작
                  </p>
                )}
              </div>
            </div>

            {/* 대화 기록 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversationHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>아직 음성인식 기록이 없습니다.</p>
                  <p className="text-sm mt-2">🎙️ 버튼을 눌러 시작해보세요!</p>
                </div>
              ) : (
                conversationHistory.map(entry => (
                  <div key={entry.id} className="bg-gray-50 p-3 rounded-lg">
                    {/* 헤더 */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-blue-600 font-medium">
                          {entry.speaker}
                        </span>
                        {entry.emotion && (
                          <span className="text-sm">
                            {getEmotionEmoji(entry.emotion)}
                          </span>
                        )}
                        {entry.conflictRisk && (
                          <span className="text-sm">
                            {getRiskEmoji(entry.conflictRisk)}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">{entry.timestamp}</span>
                        {entry.processingTime > 0 && (
                          <p className="text-xs text-gray-400">
                            {entry.processingTime.toFixed(1)}초
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* 텍스트 */}
                    <p className="text-sm text-gray-800 mb-2">{entry.text}</p>
                    
                    {/* 분석 결과 */}
                    {entry.emotion && (
                      <div className="text-xs text-gray-600 mb-1">
                        <span className="font-medium">감정:</span> {entry.emotion} 
                        ({Math.round((analysisResult?.emotion?.confidence || 0) * 100)}%)
                      </div>
                    )}
                    
                    {entry.conflictRisk && entry.conflictRisk !== 'low' && (
                      <div className="text-xs text-gray-600 mb-1">
                        <span className="font-medium">갈등위험:</span> 
                        <span className={`ml-1 px-1 rounded ${
                          entry.conflictRisk === 'high' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {entry.conflictRisk === 'high' ? '높음' : '중간'}
                        </span>
                      </div>
                    )}
                    
                    {/* 제안사항 */}
                    {entry.suggestions && entry.suggestions.length > 0 && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                        <p className="font-medium text-blue-800 mb-1">💡 제안:</p>
                        <p className="text-blue-700">{entry.suggestions[0]}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* 하단 컨트롤 */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex space-x-2">
                <button
                  onClick={handleSTTToggle}
                  disabled={isProcessing}
                  className={`flex-1 py-2 px-4 rounded-lg text-white font-medium ${
                    isRecording ? 'bg-red-500 animate-pulse' : 
                    'bg-purple-500 hover:bg-purple-600'
                  } disabled:opacity-50`}
                >
                  {isRecording ? '🛑 중지' : '🎙️ 음성인식'}
                </button>
                <button
                  onClick={() => {
                    clearResults();
                    setConversationHistory([]);
                  }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm"
                >
                  지우기
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                GMS API • Whisper-1 모델
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCallWithSTT;