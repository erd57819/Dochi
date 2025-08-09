import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/AuthStore';
import { useOpenVidu } from '../../hooks/useOpenVidu';
import { useSTT } from '../../hooks/useSTT';
import { useEmotionDetection } from '../../hooks/useEmotionDetection';

const VideoCallRoom = ({ roomCode, userId, isHost, onEndCall }) => {
  // 인증 스토어에서 토큰과 사용자 정보 가져오기
  const { token, isLoggedIn, user } = useAuthStore();
  const navigate = useNavigate();

  // 게스트 모드 관련 상태
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestNickname, setGuestNickname] = useState('');
  const [showGuestModal, setShowGuestModal] = useState(false);

  // 설정 - props에서 방 코드 사용
  const roomName = roomCode || 'test-room';
  // 실제 사용자 정보 사용: 로그인된 경우 사용자 ID, 게스트인 경우 닉네임
  const [participantName, setParticipantName] = useState(
    isLoggedIn && user ? `user-${user.id}` : '게스트'
  );

  // 녹화 상태
  const [isRecording, setIsRecording] = useState(false);

  // OpenVidu 훅 사용
  const openViduHook = useOpenVidu(roomName, participantName, isGuestMode);
  const {
    room, isConnected, participants, localVideoTrack, localAudioTrack, error,
    speakingParticipants, isLocalSpeaking, lastSpeaker, isMicOn, isCameraOn, noiseSuppressionEnabled,
    localVideoRef, remoteVideoRefs, remoteAudioRefs, pendingVideoTracks, pendingAudioTracks,
    joinRoom, leaveRoom: openViduLeaveRoom, toggleMicrophone, toggleVideo, toggleNoiseSuppression,
    updateParticipants, attachTrack
  } = openViduHook;

  // 실제 방 ID 얻기 (연결된 room 객체에서)
  const actualRoomId = room?.name || roomName;

  // STT 훅 사용 (실제 방 ID 사용)
  const sttHook = useSTT(actualRoomId, participantName);
  const {
    sttEnabled, aiMediationEnabled, conversations, currentSpeech,
    recognitionRef, speechTimeoutRef, conversationLogRef,
    toggleSTT, toggleAIMediation, stopSTT, startSTT, handleSpeechResult, sendSTTToFastAPI
  } = sttHook;

  // 감정인식 훅 사용 (실제 방 ID 사용)
  const emotionHook = useEmotionDetection(actualRoomId, participantName);
  const {
    emotionScores, conflictLevel,
    emotionAccumulatorRef, lastEmotionSentTimeRef,
    startEmotionDetection, stopEmotionDetection, updateEmotionScores,
    sendAccumulatedEmotionsToFastAPI, analyzeConflictLevel, generateEmotionAdvice,
    sendFinalEmotionData
  } = emotionHook;

  // 초기화 및 정리
  useEffect(() => {
    // 로그인 상태 확인
    if (!isLoggedIn && !isGuestMode) {
      setShowGuestModal(true);
      return;
    }

    // 로그인된 사용자는 바로 룸 참가
    if (!room) {
      console.log('룸 참가 시작...');
      joinRoom();
    }

    return () => {
      handleLeaveRoom();
    };
  }, [isLoggedIn, isGuestMode]);

  // 표정 분석 시작 (로컬 비디오가 준비되면)
  useEffect(() => {
    if (localVideoRef.current && localVideoRef.current.videoWidth > 0) {
      startEmotionDetection(localVideoRef.current);
    }

    return () => {
      stopEmotionDetection();
    };
  }, [localVideoTrack, localVideoRef.current]);

  // 갈등 레벨 분석 (감정 점수 변화 감지)
  useEffect(() => {
    analyzeConflictLevel(emotionScores);
  }, [emotionScores]);

  // 참가자 비디오 참조 생성
  const createParticipantVideoRef = (participantSid) => {
    if (!remoteVideoRefs.current.has(participantSid)) {
      remoteVideoRefs.current.set(participantSid, React.createRef());
      
      // 대기 중인 비디오 트랙이 있으면 연결
      const pendingVideoTrack = pendingVideoTracks.current.get(participantSid);
      if (pendingVideoTrack) {
        setTimeout(() => {
          const videoRef = remoteVideoRefs.current.get(participantSid);
          if (videoRef?.current) {
            videoRef.current.srcObject = pendingVideoTrack;
            videoRef.current.play().catch(console.error);
          }
        }, 100);
        pendingVideoTracks.current.delete(participantSid);
      }
    }
    return remoteVideoRefs.current.get(participantSid);
  };

  // 참가자 오디오 참조 생성
  const createParticipantAudioRef = (participantSid) => {
    if (!remoteAudioRefs.current.has(participantSid)) {
      remoteAudioRefs.current.set(participantSid, React.createRef());
      
      // 대기 중인 오디오 트랙이 있으면 연결
      const pendingAudioTrack = pendingAudioTracks.current.get(participantSid);
      if (pendingAudioTrack) {
        setTimeout(() => {
          const audioRef = remoteAudioRefs.current.get(participantSid);
          if (audioRef?.current) {
            audioRef.current.srcObject = pendingAudioTrack;
            audioRef.current.play().catch(console.error);
          }
        }, 100);
        pendingAudioTracks.current.delete(participantSid);
      }
    }
    return remoteAudioRefs.current.get(participantSid);
  };

  // 게스트로 참가
  const handleGuestJoin = () => {
    if (!guestNickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    setParticipantName(guestNickname);
    setIsGuestMode(true);
    setShowGuestModal(false);
  };

  // 로그인 페이지로 이동
  const handleLogin = () => {
    window.location.href = '/login';
  };

  // 녹화 토글
  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  // 통합 룸 나가기 함수
  const handleLeaveRoom = async () => {
    // STT 정리
    stopSTT();

    // 표정 분석 정리
    stopEmotionDetection();

    // OpenVidu 룸 나가기 (최종 감정 데이터 전송 포함)
    await openViduLeaveRoom(sendFinalEmotionData);

    // 통화 종료 후 갈등 레포트 페이지로 이동
    if (onEndCall) {
      onEndCall();
    } else {
      // onEndCall이 없으면 직접 갈등 레포트로 이동 (실제 방 ID 사용)
      navigate(`/conflict-report/${actualRoomId}`);
    }
  };

  // 게스트 모달 컴포넌트
  const GuestModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">화상채팅 참여</h2>
        <p className="text-gray-600 mb-6">
          게스트로 참여하거나 로그인하여 참여할 수 있습니다.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="guestNickname" className="block text-sm font-medium text-gray-700 mb-2">
              닉네임
            </label>
            <input
              type="text"
              id="guestNickname"
              value={guestNickname}
              onChange={(e) => setGuestNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleGuestJoin}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              게스트로 참여
            </button>
            <button
              onClick={handleLogin}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 로딩 및 에러 처리
  if (showGuestModal) {
    return <GuestModal />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">연결 오류</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">연결 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* 헤더 */}
      <div className="bg-gray-800 p-4">
        <h1 className="text-white text-xl font-bold text-center">
          화상 회의
        </h1>
        <p className="text-sm text-gray-300">
          룸: {roomName} | 상태: {isConnected ? '연결됨' : '연결 안됨'} |
          {isGuestMode ? `게스트: ${participantName}` : `로그인: ${isLoggedIn ? '완료' : '필요'}`}
        </p>
      </div>

      {/* 메인 비디오 영역 */}
      <div className="flex-1 flex">
        {/* 비디오 그리드 */}
        <div className="flex-1 relative">
          <div className={`h-full grid gap-2 p-4 ${
            participants.length === 0 ? 'grid-cols-1' :
            participants.length === 1 ? 'grid-cols-2' :
            'grid-cols-2 grid-rows-2'
          }`}>
            
            {/* 로컬 비디오 */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                나 {isMicOn ? '🎤' : '🔇'} {isCameraOn ? '📹' : '📷'}
                {isLocalSpeaking && ' 🗣️'}
              </div>
              
              {/* 감정 표시 */}
              {emotionScores[participantName] && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
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
              <div key={participant.sid} className="relative bg-gray-800 rounded-lg overflow-hidden">
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
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {participant.name} 
                  {participant.isAudioEnabled ? '🎤' : '🔇'} 
                  {participant.isVideoEnabled ? '📹' : '📷'}
                  {speakingParticipants.has(participant.sid) && ' 🗣️'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 사이드바 - 대화 및 감정 정보 */}
        <div className="w-80 bg-gray-800 flex flex-col">
          {/* 감정 및 갈등 레벨 표시 */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold mb-2">감정 상태</h3>
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>갈등 레벨</span>
                <span>{Math.round(conflictLevel)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    conflictLevel > 70 ? 'bg-red-500' :
                    conflictLevel > 40 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${conflictLevel}%` }}
                />
              </div>
            </div>
            
            {Object.entries(emotionScores).map(([name, scores]) => (
              <div key={name} className="mb-2">
                <p className="text-xs text-gray-400">{name}</p>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  {Object.entries(scores).map(([emotion, score]) => (
                    <div key={emotion} className="text-center">
                      <div className={`text-${score > 50 ? 'red' : 'gray'}-400`}>
                        {emotion}: {score}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 대화 내용 */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold">실시간 대화</h3>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={toggleSTT}
                  className={`px-3 py-1 rounded text-sm ${
                    sttEnabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  STT {sttEnabled ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={toggleAIMediation}
                  className={`px-3 py-1 rounded text-sm ${
                    aiMediationEnabled ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  AI 중재 {aiMediationEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* 현재 음성 */}
              {currentSpeech.text && (
                <div className="bg-blue-900 bg-opacity-50 p-3 rounded">
                  <p className="text-blue-300 text-sm font-medium">
                    {currentSpeech.speaker} (실시간)
                  </p>
                  <p className="text-white">{currentSpeech.text}</p>
                </div>
              )}

              {/* 대화 기록 */}
              {conversations.map((conv) => (
                <div key={conv.id} className="bg-gray-700 p-3 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-green-400 text-sm font-medium">
                      {conv.speaker}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {conv.timestamp}
                    </span>
                  </div>
                  <p className="text-white text-sm">{conv.text}</p>
                  {conv.aiSuggestion && (
                    <div className="mt-2 p-2 bg-purple-900 bg-opacity-50 rounded">
                      <p className="text-purple-300 text-xs">AI 조언:</p>
                      <p className="text-purple-100 text-sm">{conv.aiSuggestion}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 컨트롤 바 */}
      <div className="bg-gray-800 p-4">
        <div className="flex justify-center items-center space-x-4">
          {/* 마이크 토글 */}
          <button
            onClick={toggleMicrophone}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
              isMicOn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
            title={isMicOn ? '마이크 끄기' : '마이크 켜기'}
          >
            {isMicOn ? '🎤' : '🔇'}
          </button>

          {/* 비디오 토글 */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
              isCameraOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
            }`}
            title={isCameraOn ? '비디오 끄기' : '비디오 켜기'}
          >
            {isCameraOn ? '📹' : '📷'}
          </button>

          {/* 녹화 토글 */}
          <button
            onClick={toggleRecording}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
              isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title={isRecording ? '녹화 중지' : '녹화 시작'}
          >
            {isRecording ? '⏹️' : '⏺️'}
          </button>

          {/* 소음 억제 토글 */}
          <button
            onClick={toggleNoiseSuppression}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
              noiseSuppressionEnabled
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title={noiseSuppressionEnabled ? '소음 제거 ON' : '소음 제거 OFF'}
          >
            {noiseSuppressionEnabled ? '🔇' : '🔊'}
          </button>

          {/* 나가기 버튼 */}
          <button
            onClick={handleLeaveRoom}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors"
          >
            📞
          </button>
        </div>

        {/* 상태 표시 */}
        <div className="flex justify-center mt-2 text-sm text-gray-400">
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
    </div>
  );
};

export default VideoCallRoom;