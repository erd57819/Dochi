import React, { useState, useEffect, useRef } from 'react';
import { OpenVidu } from 'openvidu-browser';

// 컴포넌트 선언 및 상태관리
const VideoCallRoom = () => {
  const [session, setSession] = useState(null);
  const [mainStreamManager, setMainStreamManager] = useState(null);
  const [publisher, setPublisher] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [sessionId] = useState('test-session'); // 임시 세션 아이디
  const [token] = useState('test-token'); // 임시 토큰
  const [userName] = useState('사용자1');

  // 소리, 화면 상태
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // 
  const OV = useRef(new OpenVidu());

  // useEffect로 처음화면 나타났을 때 joinSession()실행, 페이지 닫거나 이동할 때 return문 실행 빈[]배열로 의존성 없으니 각각 한번만 실행)
  useEffect(() => {
    joinSession();
    
    return () => {
      leaveSession();
    };
  }, []);

  // joinSession
  const joinSession = async () => {
    try {
      console.log("세션 연결 시작...");

      const mySession = OV.current.initSession();

      // 다른 참가자가 들어왔을 때
      mySession.on('streamCreated', (event) => {
        console.log('새로운 스트림:', event.stream);
        const subscriber = mySession.subscribe(event.stream, undefined);
        setSubscribers(prev => [...prev, subscriber]);
      });

      // 참가자 나갔을 때
      mySession.on('streamDestroyed', (event) => {
        console.log('스트림 종료:', event.stream);
        setSubscribers(prev => 
          prev.filter(sub => sub !== event.stream.streamManager)
        );
      });

      setSession(mySession);

      // 나중엔 서버에서 토큰 받아야 함, 일단 테스트용 직접 연결
      // **TODO: 나중에 실제 OpenVidu 서버 연결로 변경**

      console.log('퍼블리셔 생성 중....');

      // 내 카메라/마이크 스트림 생성
      const publisher = await OV.current.initPublisherAsync(undefined, {
        audioSource: undefined, // 기본 마이크
        videoSource: undefined, // 기본 카메라
        publishAudio: true,
        publishVideo: true,
        resolution: '640x480',
        frameRate: 30, // frameRate 철자 수정
        insertMode: 'APPEND',
        mirror: false,
      });

      // 일단 퍼블리셔 화면에 표시  -> **실제 세션 연결은 나중에**
      setMainStreamManager(publisher);
      setPublisher(publisher);

      console.log('퍼블리셔 생성 완료');

    } catch (error) {
      console.error('세션 연결 실패:', error);
    }
  };

  const leaveSession = () => {
    if (session) {
      session.disconnect(); // 점(.) 수정
    }
    
    setSession(null);
    setSubscribers([]);
    setMainStreamManager(null);
    setPublisher(null);
  };

  // 오디오 토글
  const toggleAudio = () => {
    if (publisher) {
      publisher.publishAudio(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // 비디오 토글
  const toggleVideo = () => {
    if (publisher) {
      publisher.publishVideo(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      {/* 헤더 */}
      <div className="bg-gray-800 p-4 text-white">
        <h1 className="text-xl font-bold">🦔 참견도치 화상통화 테스트</h1>
        <p className="text-sm text-gray-300">세션: {sessionId}</p>
      </div>

      {/* 메인 비디오 영역 */}
      <div className="flex-1 p-4">
        <div className="w-full h-full bg-black rounded-lg relative overflow-hidden">
          {mainStreamManager && (
            <video
              autoPlay={true}
              ref={(video) => {
                if (video) {
                  mainStreamManager.addVideoElement(video);
                }
              }}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* 사용자 정보 오버레이 */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded">
            <span className="text-sm">{userName} (나)</span>
          </div>
        </div>

        {/* 다른 참가자들 (나중에 구현) */}
        {subscribers.length > 0 && (
          <div className="mt-4 flex gap-4">
            {subscribers.map((sub, i) => (
              <div key={i} className="w-48 h-36 bg-black rounded-lg">
                <video
                  autoPlay={true}
                  ref={(video) => {
                    if (video) {
                      sub.addVideoElement(video);
                    }
                  }}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 컨트롤 바 */}
      <div className="bg-gray-800 p-4">
        <div className="flex justify-center gap-4">
          {/* 마이크 버튼 */}
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
              isAudioEnabled 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isAudioEnabled ? '🎤' : '🔇'}
          </button>

          {/* 카메라 버튼 */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
              isVideoEnabled 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isVideoEnabled ? '📹' : '📵'}
          </button>

          {/* 나가기 버튼 */}
          <button
            onClick={leaveSession}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors"
          >
            📞
          </button>
        </div>
        
        {/* 상태 표시 */}
        <div className="flex justify-center mt-2 text-sm text-gray-400">
          <span>마이크: {isAudioEnabled ? 'ON' : 'OFF'}</span>
          <span className="mx-2">|</span>
          <span>카메라: {isVideoEnabled ? 'ON' : 'OFF'}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCallRoom;