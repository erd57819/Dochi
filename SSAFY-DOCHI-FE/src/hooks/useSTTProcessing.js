import { useState, useRef, useCallback, useEffect } from 'react';

// API 엔드포인트 설정 (AI 서버 직접 연결)
const API_ENDPOINTS = [
  '/ai',        // AI 서비스 직접 연결
  '/dochi'      // 백엔드 (fallback)
];

export const useSTTProcessing = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processingTime, setProcessingTime] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentApiUrl, setCurrentApiUrl] = useState(API_ENDPOINTS[0]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // 작동하는 서버 찾기
  const findWorkingEndpoint = useCallback(async () => {
    for (const endpoint of API_ENDPOINTS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${endpoint}/stt/health`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          setCurrentApiUrl(endpoint);
          console.log(`STT 서버 연결 성공: ${endpoint}`);
          return endpoint;
        }
      } catch (err) {
        console.log(`엔드포인트 실패: ${endpoint} - ${err.message}`);
        continue;
      }
    }
    throw new Error('사용 가능한 STT 서버를 찾을 수 없습니다');
  }, []);

  // STT 처리
  const processSTT = useCallback(async (audioBlob, analyzeContent = false) => {
    setIsProcessing(true);
    setError(null);

    try {
      // 서버 찾기
      let apiUrl = currentApiUrl;
      try {
        apiUrl = await findWorkingEndpoint();
      } catch (endpointError) {
        throw new Error('서버에 연결할 수 없습니다. 도커 컨테이너 상태를 확인해주세요.');
      }

      const formData = new FormData();
      formData.append('audioFile', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');
      
      if (analyzeContent) {
        formData.append('analyzeEmotion', 'true');
        formData.append('analyzeDonflict', 'true');
      }

      const endpoint = analyzeContent ? '/stt/transcribe-and-analyze' : '/stt/transcribe';
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      // 결과를 상태에 강제로 업데이트
      if (result.transcript) {
        setTranscript(result.transcript);
      }
      setProcessingTime(result.processing_time || 0);
      
      if (analyzeContent && result.emotion_analysis) {
        setAnalysisResult({
          emotion: result.emotion_analysis,
          conflictRisk: result.conflict_risk,
          suggestions: result.suggestions || []
        });
      }

      // 콘솔 로그 제거하고 UI에만 표시되도록 함
      return result;

    } catch (err) {
      console.error('STT 처리 오류:', err);
      setError(err.message || '음성 처리 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [currentApiUrl, findWorkingEndpoint]);

  // 녹음 시작
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        
        if (audioBlob.size > 0) {
          await processSTT(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (err) {
      console.error('녹음 시작 실패:', err);
      setError('마이크 접근 권한이 필요합니다.');
    }
  }, [processSTT]);

  // 녹음 중지
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // 녹음 토글
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // 분석과 함께 녹음
  const recordWithAnalysis = useCallback(async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        
        if (audioBlob.size > 0) {
          await processSTT(audioBlob, true); // 분석 포함
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (err) {
      console.error('분석 녹음 시작 실패:', err);
      setError('마이크 접근 권한이 필요합니다.');
    }
  }, [processSTT]);

  // 파일 업로드 처리
  const transcribeFile = useCallback(async (file, analyzeContent = false) => {
    if (!file) return;

    const audioBlob = new Blob([file], { type: file.type });
    return await processSTT(audioBlob, analyzeContent);
  }, [processSTT]);

  // 결과 초기화
  const clearResults = useCallback(() => {
    setTranscript('');
    setProcessingTime(0);
    setAnalysisResult(null);
    setError(null);
  }, []);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 정리
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    // 상태
    isRecording,
    isProcessing,
    transcript,
    processingTime,
    analysisResult,
    error,
    
    // 액션
    startRecording,
    stopRecording,
    toggleRecording,
    recordWithAnalysis,
    transcribeFile,
    findWorkingEndpoint,
    
    // 유틸리티
    clearResults,
    clearError
  };
};