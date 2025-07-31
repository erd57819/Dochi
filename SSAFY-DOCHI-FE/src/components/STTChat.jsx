import React, { useState, useRef } from 'react';
import { useSTTProcessing } from '../hooks/useSTTProcessing';

const STTChat = () => {
  const [fileInput, setFileInput] = useState(null);
  const [analysisMode, setAnalysisMode] = useState(false);
  const fileInputRef = useRef(null);
  
  const {
    isRecording,
    isProcessing,
    transcript,
    processingTime,
    analysisResult,
    error,
    toggleRecording,
    recordWithAnalysis,
    transcribeFile,
    clearResults,
    clearError
  } = useSTTProcessing();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileInput(file);
      transcribeFile(file, analysisMode);
    }
  };

  const handleRecordClick = () => {
    if (analysisMode) {
      if (isRecording) {
        // 분석 모드에서는 recordWithAnalysis 사용
        toggleRecording(); // 중지
      } else {
        recordWithAnalysis(); // 분석과 함께 시작
      }
    } else {
      toggleRecording(); // 일반 STT
    }
  };

  const getEmotionColor = (emotion) => {
    switch (emotion) {
      case 'happy': case 'positive': return 'text-green-600 bg-green-50';
      case 'angry': case 'frustrated': return 'text-red-600 bg-red-50';
      case 'sad': return 'text-blue-600 bg-blue-50';
      case 'anxious': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'text-red-700 bg-red-100 border-red-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-green-700 bg-green-100 border-green-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🎤 음성인식 STT 시스템
        </h1>
        <p className="text-gray-600">
          GMS API (Whisper-1) 모델을 사용한 정확한 한국어 음성인식
        </p>
      </div>

      {/* 분석 모드 토글 */}
      <div className="mb-6 flex justify-center">
        <label className="flex items-center space-x-3 cursor-pointer">
          <span className="text-sm font-medium text-gray-700">
            감정/갈등 분석 포함
          </span>
          <div className="relative">
            <input
              type="checkbox"
              checked={analysisMode}
              onChange={(e) => setAnalysisMode(e.target.checked)}
              className="sr-only"
            />
            <div className={`block w-14 h-8 rounded-full ${
              analysisMode ? 'bg-blue-500' : 'bg-gray-300'
            }`}></div>
            <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${
              analysisMode ? 'transform translate-x-6' : ''
            }`}></div>
          </div>
        </label>
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
          🎤 음성 녹음
        </h2>
        
        <div className="flex flex-col items-center space-y-4">
          {/* 녹음 버튼 */}
          <button
            onClick={handleRecordClick}
            disabled={isProcessing}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl
              transition-all duration-300 shadow-lg
              ${isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'
              }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
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
                ⏳ Whisper-1 모델로 처리 중...
              </p>
            )}
            {!isRecording && !isProcessing && (
              <div className="text-center">
                <p className="text-gray-600 mb-2">
                  {analysisMode ? '🔍 분석 모드: ' : '📝 일반 모드: '}
                  녹음 버튼을 눌러 시작하세요
                </p>
                <p className="text-sm text-gray-500">
                  {analysisMode 
                    ? '음성인식 + 감정분석 + 갈등위험도 분석' 
                    : '음성인식만 수행'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 파일 업로드 섹션 */}
      <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          📁 오디오 파일 업로드
        </h2>
        
        <div className="flex flex-col items-center space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            📁 오디오 파일 선택
          </button>
          
          <p className="text-sm text-gray-600 text-center">
            지원 형식: MP3, WAV, WebM, OGG, MP4<br/>
            최대 파일 크기: 25MB
          </p>
          
          {fileInput && (
            <p className="text-sm text-blue-600">
              선택된 파일: {fileInput.name}
            </p>
          )}
        </div>
      </div>

      {/* 결과 섹션 */}
      {transcript && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              📝 변환 결과
            </h3>
            <div className="flex items-center space-x-4">
              {processingTime > 0 && (
                <span className="text-sm text-gray-500">
                  처리시간: {processingTime.toFixed(2)}초
                </span>
              )}
              <button
                onClick={clearResults}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                지우기
              </button>
            </div>
          </div>
          
          {/* 변환된 텍스트 */}
          <div className="mb-4 p-4 bg-white rounded-lg border">
            <h4 className="font-medium text-gray-800 mb-2">🎤 음성 → 텍스트:</h4>
            <p className="text-gray-800 leading-relaxed">{transcript}</p>
          </div>

          {/* 분석 결과 (분석 모드인 경우) */}
          {analysisResult && (
            <div className="space-y-4">
              {/* 감정 분석 */}
              {analysisResult.emotion && (
                <div className={`p-4 rounded-lg border ${getEmotionColor(analysisResult.emotion.emotion)}`}>
                  <h4 className="font-medium mb-2">😊 감정 분석</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">감정:</span> {analysisResult.emotion.emotion}
                    </div>
                    <div>
                      <span className="font-medium">신뢰도:</span> {Math.round(analysisResult.emotion.confidence * 100)}%
                    </div>
                    <div>
                      <span className="font-medium">강도:</span> {Math.round(analysisResult.emotion.intensity * 100)}%
                    </div>
                    <div>
                      <span className="font-medium">키워드:</span> {analysisResult.emotion.detected_keywords.join(', ') || '없음'}
                    </div>
                  </div>
                </div>
              )}

              {/* 갈등 위험도 */}
              {analysisResult.conflictRisk && (
                <div className={`p-4 rounded-lg border ${getRiskColor(analysisResult.conflictRisk)}`}>
                  <h4 className="font-medium mb-2">⚠️ 갈등 위험도</h4>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="font-medium">
                      위험도: 
                      <span className="ml-1 px-2 py-1 rounded text-xs bg-white">
                        {analysisResult.conflictRisk === 'high' ? '높음' : 
                         analysisResult.conflictRisk === 'medium' ? '중간' : '낮음'}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {/* 제안사항 */}
              {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-3">💡 개선 제안</h4>
                  <ul className="space-y-2">
                    {analysisResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-blue-700 flex items-start">
                        <span className="text-blue-500 mr-2 mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
          <p><strong>음성 녹음:</strong> 🎤 버튼 클릭 → 명확하게 말하기 → 다시 클릭하여 중지</p>
          <p><strong>파일 업로드:</strong> 📁 버튼으로 오디오 파일 선택 → 자동 변환</p>
          <p><strong>분석 모드:</strong> 토글 활성화 시 감정분석과 갈등위험도 분석 포함</p>
          <p><strong>지원 언어:</strong> 한국어 (Whisper-1 모델 사용)</p>
        </div>
      </div>

      {/* 기술 정보 */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>GMS API (Whisper-1) • 참견도치 STT 시스템</p>
      </div>
    </div>
  );
};

export default STTChat;