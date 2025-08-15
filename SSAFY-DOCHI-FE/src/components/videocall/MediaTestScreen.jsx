import React, { useState, useEffect, useRef } from 'react';
import dochiImg from '@/assets/image-65.png';

const MediaTestScreen = ({ 
  onTestComplete, 
  onCancel,
  initialCameraEnabled = true,
  initialAudioEnabled = true 
}) => {
  // 상태 변수
  const [testStream, setTestStream] = useState(null);
  const [testVideoEnabled, setTestVideoEnabled] = useState(initialCameraEnabled);
  const [testAudioEnabled, setTestAudioEnabled] = useState(initialAudioEnabled);
  const [audioLevel, setAudioLevel] = useState(0);
  const [mediaDevices, setMediaDevices] = useState({ cameras: [], microphones: [], speakers: [] });
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMicrophone, setSelectedMicrophone] = useState('');
  const [noiseSuppressionEnabled, setNoiseSuppressionEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 참조 변수
  const testVideoRef = useRef(null);
  const testAudioContextRef = useRef(null);
  const testAnalyserRef = useRef(null);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    initializeMediaTest();
    return () => {
      stopTestStream();
    };
  }, []);

  // 미디어 테스트 초기화
  const initializeMediaTest = async () => {
    try {
      await getMediaDevices();
    } catch (error) {
      console.error('미디어 디바이스 초기화 실패:', error);
      setError('미디어 디바이스를 불러올 수 없습니다.');
    }
  };

  // 미디어 상태 변경 시 스트림 업데이트
  useEffect(() => {
    if (mediaDevices.cameras.length > 0 || mediaDevices.microphones.length > 0) {
      startTestStream();
    }
    return () => {
      if (testStream) {
        stopTestStream();
      }
    };
  }, [testVideoEnabled, testAudioEnabled, selectedCamera, selectedMicrophone]);

  // 미디어 디바이스 목록 가져오기
  const getMediaDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      const microphones = devices.filter(device => device.kind === 'audioinput');
      const speakers = devices.filter(device => device.kind === 'audiooutput');
      
      setMediaDevices({ cameras, microphones, speakers });
      
      // 기본 디바이스 선택
      if (cameras.length > 0 && !selectedCamera) {
        setSelectedCamera(cameras[0].deviceId);
      }
      if (microphones.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(microphones[0].deviceId);
      }
    } catch (error) {
      console.error('미디어 디바이스 목록 가져오기 실패:', error);
    }
  };

  // 테스트 스트림 시작
  const startTestStream = async () => {
    try {
      setLoading(true);
      setError(null);

      // 기존 스트림 정리
      if (testStream) {
        stopTestStream();
      }

      // getUserMedia는 최소 하나의 미디어(audio 또는 video)가 필요
      if (!testVideoEnabled && !testAudioEnabled) {
        console.log('오디오와 비디오가 모두 비활성화되어 스트림을 생성하지 않습니다.');
        return;
      }

      const constraints = {
        video: testVideoEnabled ? {
          deviceId: selectedCamera && selectedCamera !== '' ? { exact: selectedCamera } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false,
        audio: testAudioEnabled ? {
          deviceId: selectedMicrophone && selectedMicrophone !== '' ? { exact: selectedMicrophone } : undefined,
          echoCancellation: true,
          noiseSuppression: noiseSuppressionEnabled
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setTestStream(stream);

      // 비디오 연결
      if (testVideoRef.current && testVideoEnabled) {
        testVideoRef.current.srcObject = stream;
        testVideoRef.current.play().catch(console.error);
      }

      // 오디오 레벨 분석 시작
      if (testAudioEnabled) {
        setupAudioLevelDetection(stream);
      }

    } catch (error) {
      console.error('테스트 스트림 시작 실패:', error);
      setError(`미디어 접근 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 오디오 레벨 감지 설정
  const setupAudioLevelDetection = (stream) => {
    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      testAudioContextRef.current = audioContext;
      testAnalyserRef.current = analyser;
      
      // 오디오 레벨 모니터링 시작
      const checkAudioLevel = () => {
        if (!testAnalyserRef.current) return;
        
        const bufferLength = testAnalyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        testAnalyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setAudioLevel(Math.round((average / 255) * 100));
        
        requestAnimationFrame(checkAudioLevel);
      };
      
      checkAudioLevel();
    } catch (error) {
      console.error('오디오 레벨 감지 설정 실패:', error);
    }
  };

  // 테스트 스트림 정리
  const stopTestStream = () => {
    if (testStream) {
      testStream.getTracks().forEach(track => track.stop());
      setTestStream(null);
    }
    
    if (testAudioContextRef.current) {
      testAudioContextRef.current.close();
      testAudioContextRef.current = null;
    }
    
    if (testVideoRef.current) {
      testVideoRef.current.srcObject = null;
    }
    
    setAudioLevel(0);
  };

  // 테스트 비디오 토글
  const toggleTestVideo = () => {
    setTestVideoEnabled(!testVideoEnabled);
  };

  // 테스트 오디오 토글
  const toggleTestAudio = () => {
    setTestAudioEnabled(!testAudioEnabled);
  };

  // 디바이스 변경
  const handleDeviceChange = (type, deviceId) => {
    if (type === 'camera') {
      setSelectedCamera(deviceId);
    } else if (type === 'microphone') {
      setSelectedMicrophone(deviceId);
    }
  };

  // 소음 억제 토글
  const toggleNoiseSuppression = () => {
    setNoiseSuppressionEnabled(!noiseSuppressionEnabled);
  };

  // 테스트 완료 및 설정 전달
  const handleTestComplete = () => {
    const settings = {
      cameraEnabled: testVideoEnabled,
      micEnabled: testAudioEnabled,
      cameraDeviceId: selectedCamera,
      micDeviceId: selectedMicrophone,
      noiseSuppression: noiseSuppressionEnabled
    };
    
    stopTestStream();
    onTestComplete(settings);
  };

  // 취소
  const handleCancel = () => {
    stopTestStream();
    onCancel();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-4xl w-full shadow-lg" style={{
        border: '1px solid rgba(131, 103, 63, 0.08)'
      }}>
        <div className="p-6 flex items-center gap-4 border-b" style={{ borderColor: 'rgba(131, 103, 63, 0.1)' }}>
          <img src={dochiImg} alt="Dochi" className="w-16 h-16" />
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#bf7d2c' }}>화상회의 준비</h2>
            <p className="text-gray-600 text-sm">원활한 화상회의를 위해 카메라와 마이크가 제대로 작동하는지 확인해주세요.</p>
          </div>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* 비디오 프리뷰 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-medium" style={{ color: '#bf7d2c' }}>카메라 테스트</h3>
              <button
                onClick={toggleTestVideo}
                disabled={loading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${testVideoEnabled ? 'text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                style={{ backgroundColor: testVideoEnabled ? '#bf7d2c' : undefined }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {testVideoEnabled ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M5.636 5.636L12 12" />
                  )}
                </svg>
              </button>
            </div>
            <div className="relative bg-gray-50 rounded-lg overflow-hidden aspect-video" style={{ border: '1px solid rgba(131, 103, 63, 0.15)' }}>
              {testVideoEnabled ? (
                <video
                  ref={testVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">카메라가 꺼져있습니다</p>
                  </div>
                </div>
              )}
            </div>

            {/* 카메라 선택 */}
            {mediaDevices.cameras.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카메라 선택</label>
                <select
                  value={selectedCamera}
                  onChange={(e) => handleDeviceChange('camera', e.target.value)}
                  className="w-full max-w-sm px-3 py-2 bg-transparent border-0 border-b border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-sm transition-colors text-center mx-auto block"
                >
                  {mediaDevices.cameras.map((camera) => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || '카메라 ' + camera.deviceId.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 오디오 테스트 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-medium" style={{ color: '#bf7d2c' }}>마이크 테스트</h3>
              <button
                onClick={toggleTestAudio}
                disabled={loading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${testAudioEnabled ? 'text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                style={{ backgroundColor: testAudioEnabled ? '#bf7d2c' : undefined }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {testAudioEnabled ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  ) : (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-3a1 1 0 011-1h1.586l4.707-4.707C10.923 5.663 12 6.109 12 7v10c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            
            {/* 마이크 레벨 표시 */}
            <div className="p-3 rounded-lg" style={{
              backgroundColor: '#faf8f5',
              border: '1px solid rgba(131, 103, 63, 0.15)'
            }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">음성 레벨</span>
                <span className="text-xs font-medium text-gray-700">{audioLevel}%</span>
              </div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: '#f0f0f0' }}>
                <div
                  className="h-2 rounded-full transition-all duration-150"
                  style={{
                    width: `${Math.min(audioLevel, 100)}%`,
                    backgroundColor: audioLevel > 50 ? '#bf7d2c' : audioLevel > 20 ? '#cd9f6e' : '#EE9278'
                  }}
                />
              </div>
              <p className="text-xs mt-1 text-gray-400">
                마이크에 대고 말씀해보세요. 막대가 움직이면 정상입니다.
              </p>
            </div>

            {/* 마이크 선택 */}
            {mediaDevices.microphones.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">마이크 선택</label>
                <select
                  value={selectedMicrophone}
                  onChange={(e) => handleDeviceChange('microphone', e.target.value)}
                  className="w-full max-w-sm px-3 py-2 bg-transparent border-0 border-b border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-sm transition-colors text-center mx-auto block"
                >
                  {mediaDevices.microphones.map((mic) => (
                    <option key={mic.deviceId} value={mic.deviceId}>
                      {mic.label || '마이크 ' + mic.deviceId.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 소음 억제 설정 */}
            <div className="flex items-center justify-between p-2 rounded-md" style={{
              backgroundColor: '#faf8f5',
              border: '1px solid rgba(131, 103, 63, 0.15)'
            }}>
              <span className="text-sm text-gray-600">소음 억제</span>
              <button
                onClick={toggleNoiseSuppression}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${noiseSuppressionEnabled ? 'text-white' : 'bg-gray-200 text-gray-600'}`}
                style={{ backgroundColor: noiseSuppressionEnabled ? '#bf7d2c' : undefined }}
              >
                {noiseSuppressionEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t flex justify-between" style={{ borderColor: 'rgba(131, 103, 63, 0.1)' }}>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 rounded-md text-sm transition-all hover:scale-[0.98] bg-white text-[#bf7d2c] border border-[#bf7d2c] hover:bg-[#bf7d2c] hover:text-white"
          >
            뒤로 가기
          </button>
          <button
            onClick={handleTestComplete}
            disabled={loading}
            className="px-6 py-2 text-white text-sm font-medium rounded-md transition-all hover:scale-[0.98] hover:opacity-90 shadow-sm"
            style={{ backgroundColor: '#bf7d2c' }}
          >
            {loading ? '설정 중...' : '이 설정으로 통화 시작'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaTestScreen;
