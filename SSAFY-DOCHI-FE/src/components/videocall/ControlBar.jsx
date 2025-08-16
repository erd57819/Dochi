import React from 'react';

const ControlBar = ({
  isMicOn,
  isCameraOn,
  noiseSuppressionEnabled,
  sttEnabled,
  aiMediationEnabled,
  toggleMicrophone,
  toggleVideo,
  toggleNoiseSuppression,
  toggleSTT,
  handleLeaveRoom
}) => {
  return (
    <div className="bg-[#FEFCF8] shadow-lg p-4 flex-shrink-0 border-t border-[#5C351A]">
      <div className="flex justify-center items-center space-x-4">
        <button
          onClick={toggleMicrophone}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors shadow-lg border-2`}
          style={{
            backgroundColor: isMicOn ? '#bf7d2c' : '#fed7aa',
            borderColor: isMicOn ? '#D2691E' : '#fdba74'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = isMicOn ? '#D2691E' : '#fdba74';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = isMicOn ? '#bf7d2c' : '#fed7aa';
          }}
          title={isMicOn ? '마이크 끄기' : '마이크 켜기'}
        >
          {isMicOn ? '🎤' : '🔇'}
        </button>

        <button
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors shadow-lg border-2`}
          style={{
            backgroundColor: isCameraOn ? '#ea580c' : '#fed7aa',
            borderColor: isCameraOn ? '#c2410c' : '#fdba74'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = isCameraOn ? '#c2410c' : '#fdba74';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = isCameraOn ? '#ea580c' : '#fed7aa';
          }}
          title={isCameraOn ? '비디오 끄기' : '비디오 켜기'}
        >
          {isCameraOn ? '📹' : '📷'}
        </button>

        <button
          onClick={toggleNoiseSuppression}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg border-2`}
          style={{
            backgroundColor: noiseSuppressionEnabled ? '#bf7d2c' : '#fed7aa',
            borderColor: noiseSuppressionEnabled ? '#D2691E' : '#fdba74',
            color: noiseSuppressionEnabled ? 'white' : '#bf7d2c'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = noiseSuppressionEnabled ? '#D2691E' : '#fdba74';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = noiseSuppressionEnabled ? '#bf7d2c' : '#fed7aa';
          }}
          title={noiseSuppressionEnabled ? '소음 제거 ON' : '소음 제거 OFF'}
        >
          {noiseSuppressionEnabled ? '🔇' : '🔊'}
        </button>

        <button
          onClick={toggleSTT}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg border-2`}
          style={{
            backgroundColor: sttEnabled ? '#10b981' : '#fed7aa',
            borderColor: sttEnabled ? '#059669' : '#fdba74',
            color: 'white'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = sttEnabled ? '#059669' : '#fdba74';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = sttEnabled ? '#10b981' : '#fed7aa';
          }}
          title={sttEnabled ? 'STT ON' : 'STT OFF'}
        >
          {sttEnabled ? '🎙️' : '🎯'}
        </button>

        <button
          onClick={() => handleLeaveRoom(true)}
          className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors shadow-lg border-2"
          style={{
            backgroundColor: '#bf7d2c',
            borderColor: '#D2691E'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#D2691E'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#bf7d2c'}
        >
          📞
        </button>
      </div>

      <div className="flex justify-center mt-2 text-sm text-[#4A4A4A] font-medium">
        <span>마이크: {isMicOn ? 'ON' : 'OFF'}</span>
        <span className="mx-2">|</span>
        <span>카메라: {isCameraOn ? 'ON' : 'OFF'}</span>
        <span className="mx-2">|</span>
        <span>STT: {sttEnabled ? 'ON' : 'OFF'}</span>
        {aiMediationEnabled && (
          <>
            <span className="mx-2">|</span>
            <span>AI 중재: ON</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ControlBar;