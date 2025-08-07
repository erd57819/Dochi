import React from 'react';

const VideoGrid = ({ 
  localVideoRef, 
  remoteParticipants, 
  isVideoEnabled, 
  isLoading 
}) => {
  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {/* 로컬 비디오 */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
        />
        {!isVideoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-white text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <span className="text-sm">나 (비디오 꺼짐)</span>
            </div>
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          나 {isLoading ? '(연결 중...)' : ''}
        </div>
      </div>

      {/* 원격 참가자들 */}
      {remoteParticipants.map((participant) => (
        <div key={participant.sid} className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
          <video
            ref={(el) => {
              if (el && participant.videoTrack) {
                participant.videoTrack.attach(el);
              }
            }}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {participant.identity}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;