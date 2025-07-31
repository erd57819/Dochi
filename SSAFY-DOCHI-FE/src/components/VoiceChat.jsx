import React, { useState } from 'react';
import { useVoiceProcessing } from '../hooks/useVoiceProcessing';

const VoiceChat = () => {
  const [inputText, setInputText] = useState('');
  
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

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      speakText(inputText.trim());
      setInputText('');
    }
  };

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* 숨겨진 오디오 엘리먼트 */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          음성 인식 TTS 시스템
        </h1>
        <p className="text-gray-600">
          음성으로 대화하거나 텍스트를 입력하여 음성으로 들어보세요
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 음성 녹음 섹션 */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          🎤 음성 대화
        </h2>
        
        <div className="flex flex-col items-center space-y-4">
          {/* 녹음 버튼 */}
          <button
            onClick={handleRecordToggle}
            disabled={isProcessing || isPlaying}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl
              transition-all duration-300 shadow-lg
              ${isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'
              }
              ${(isProcessing || isPlaying) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>
          
          {/* 상태 표시 */}
          <div className="text-center">
            {isRecording && (
              <p className="text-red-600 font-medium animate-pulse">
                🔴 녹음 중... 버튼을 다시 눌러 중지하세요
              </p>
            )}
            {isProcessing && (
              <p className="text-blue-600 font-medium">
                ⏳ 음성 처리 중...
              </p>
            )}
            {isPlaying && (
              <p className="text-green-600 font-medium">
                🔊 음성 재생 중...
              </p>
            )}
            {!isRecording && !isProcessing && !isPlaying && (
              <p className="text-gray-600">
                녹음 버튼을 눌러 음성 대화를 시작하세요
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 텍스트 입력 섹션 */}
      <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          ✏️ 텍스트 음성 변환
        </h2>
        
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="음성으로 변환할 텍스트를 입력하세요..."
              disabled={isProcessing || isPlaying}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing || isPlaying}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              🔊 말하기
            </button>
          </div>
        </form>
      </div>

      {/* 대화 결과 섹션 */}
      {(transcript || responseText) && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              💬 대화 결과
            </h3>
            <button
              onClick={clearResults}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              지우기
            </button>
          </div>
          
          {transcript && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <h4 className="font-medium text-blue-800 mb-2">🎤 당신이 말한 내용:</h4>
              <p className="text-gray-800">{transcript}</p>
            </div>
          )}
          
          {responseText && (
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
              <h4 className="font-medium text-green-800 mb-2">🤖 AI 응답:</h4>
              <p className="text-gray-800">{responseText}</p>
              <button
                onClick={() => speakText(responseText)}
                disabled={isProcessing || isPlaying}
                className="mt-2 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                🔊 다시 듣기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 사용법 안내 */}
      <div className="mt-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">
          📋 사용법
        </h3>
        <div className="space-y-2 text-sm text-yellow-700">
          <p><strong>음성 대화:</strong> 🎤 버튼을 눌러 녹음 시작 → 말하기 → 다시 버튼을 눌러 중지 → AI가 응답음성 재생</p>
          <p><strong>텍스트 음성변환:</strong> 텍스트 입력 → 말하기 버튼 클릭 → 음성으로 재생</p>
          <p><strong>지원 언어:</strong> 한국어 (음성인식 및 음성합성)</p>
        </div>
      </div>

      {/* 개발자 정보 */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>참견도치 - AI 기반 음성 대화 시스템</p>
      </div>
    </div>
  );
};

export default VoiceChat;