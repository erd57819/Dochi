import React from 'react';

const ControlBar = ({
  isVideoEnabled,
  isAudioEnabled,
  noiseSuppressionEnabled,
  isRecording,
  toggleVideo,
  toggleMicrophone,
  toggleNoiseSuppression,
  toggleRecording,
  leaveRoom
}) => {
  return (
    <div className="bg-gray-800 p-4 flex justify-center space-x-4">
      {/* 비디오 토글 */}
      <button
        onClick={toggleVideo}
        className={`p-3 rounded-full ${
          isVideoEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
        } text-white transition-colors`}
        title={isVideoEnabled ? '비디오 끄기' : '비디오 켜기'}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          {isVideoEnabled ? (
            <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/>
          ) : (
            <path d="M21 6.5l-4 4V7a1 1 0 0 0-1-1H9.5l8 8V10.5l4 4v-8zM3.4 1.7L2 3.1 4.9 6H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.9l1.9 1.9 1.4-1.4L3.4 1.7z"/>
          )}
        </svg>
      </button>

      {/* 오디오 토글 */}
      <button
        onClick={toggleMicrophone}
        className={`p-3 rounded-full ${
          isAudioEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
        } text-white transition-colors`}
        title={isAudioEnabled ? '마이크 끄기' : '마이크 켜기'}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          {isAudioEnabled ? (
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          ) : (
            <path d="M10.8 4.9c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2l-.01 3.91L15 10.6V5c0-1.66-1.34-3-3-3-1.54 0-2.79 1.16-2.96 2.65l1.76 1.76V4.9zM19 11h-1.7c0 .58-.1 1.13-.27 1.64l1.27 1.27c.44-.88.7-1.87.7-2.91zM4.41 2.86L3 4.27l6 6V11c0 1.66 1.34 3 3 3 .23 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.24-5.3-5H5.3c0 3.53 2.61 6.43 6 6.93V21h2v-3.07c.98-.07 1.91-.37 2.72-.84L21 22.14l1.41-1.41L4.41 2.86z"/>
          )}
        </svg>
      </button>

      {/* 노이즈 억제 토글 */}
      <button
        onClick={toggleNoiseSuppression}
        className={`p-3 rounded-full ${
          noiseSuppressionEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
        } text-white transition-colors`}
        title={noiseSuppressionEnabled ? '노이즈 억제 끄기' : '노이즈 억제 켜기'}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/>
        </svg>
      </button>

      {/* 녹화 토글 */}
      <button
        onClick={toggleRecording}
        className={`p-3 rounded-full ${
          isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
        } text-white transition-colors`}
        title={isRecording ? '녹화 중지' : '녹화 시작'}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          {isRecording ? (
            <path d="M6 6h12v12H6z"/>
          ) : (
            <circle cx="12" cy="12" r="8"/>
          )}
        </svg>
      </button>

      {/* 통화 종료 */}
      <button
        onClick={leaveRoom}
        className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
        title="통화 종료"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.7l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
        </svg>
      </button>
    </div>
  );
};

export default ControlBar;