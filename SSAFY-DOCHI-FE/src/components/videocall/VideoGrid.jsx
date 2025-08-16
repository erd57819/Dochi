import React from 'react';

const VideoGrid = ({ 
  participants, 
  localVideoRef,
  participantName,
  isMicOn,
  isCameraOn,
  isLocalSpeaking,
  emotionScores,
  speakingParticipants,
  createParticipantVideoRef,
  createParticipantAudioRef
}) => {
  return (
    <div className="flex-1 relative">
      <div className={`h-full grid gap-2 p-4 ${
        participants.length === 0 ? 'grid-cols-1' : 'grid-cols-2'
      }`}>
        
        {/* 로컬 비디오 */}
        <div className="relative bg-[#F2EDE2] rounded-lg overflow-hidden border border-[#5C351A] shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-[#FEFCF8] bg-opacity-90 text-[#2A2A2A] px-2 py-1 rounded text-sm shadow-lg border border-[#5C351A]">
            나 {isMicOn ? '🎤' : '🔇'} {isCameraOn ? '📹' : '📷'}
            {isLocalSpeaking && ' 🗣️'}
          </div>
          
          {/* 감정 표시 */}
          {emotionScores[participantName] && (
            <div className="absolute top-2 right-2 bg-[#F8F5F0] bg-opacity-90 text-[#5C351A] px-2 py-1 rounded text-xs shadow-lg border border-[#5C351A]">
              {Object.entries(emotionScores[participantName])
                .sort(([,a], [,b]) => b - a)
                .slice(0, 1)
                .map(([emotion, score]) => (
                  <span key={emotion}>
                    {emotion}: {score}%
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* 원격 참가자 비디오 */}
        {participants.map((participant) => (
          <div key={participant.sid} className="relative bg-[#F2EDE2] rounded-lg overflow-hidden border border-[#5C351A] shadow-lg">
            <video
              ref={createParticipantVideoRef(participant.sid)}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <audio
              ref={createParticipantAudioRef(participant.sid)}
              autoPlay
            />
            <div className="absolute bottom-2 left-2 bg-[#FEFCF8] bg-opacity-90 text-[#2A2A2A] px-2 py-1 rounded text-sm shadow-lg border border-[#5C351A]">
              {participant.name} 
              {participant.isAudioEnabled ? '🎤' : '🔇'} 
              {participant.isVideoEnabled ? '📹' : '📷'}
              {speakingParticipants.has(participant.sid) && ' 🗣️'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;