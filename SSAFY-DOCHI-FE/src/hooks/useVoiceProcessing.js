import { useState, useRef, useEffect, useCallback } from 'react';

const API_BASE_URL = '/ai';

export const useVoiceProcessing = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responseText, setResponseText] = useState('');
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);

  // 녹음 시작
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
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
          await processVoice(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (err) {
      console.error('녹음 시작 실패:', err);
      setError('마이크 접근 권한이 필요합니다.');
    }
  }, []);

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

  // 음성 처리 (STT + TTS)
  const processVoice = useCallback(async (audioBlob) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.webm');
      formData.append('language', 'ko-KR');
      formData.append('tts_language', 'ko');
      formData.append('speed', '1.0');
      formData.append('voice_type', 'female');

      const response = await fetch(`${API_BASE_URL}/voice/process-voice`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      setTranscript(result.transcript);
      setResponseText(result.response_text);

      // TTS 오디오 재생
      if (result.audio_base64) {
        await playTTSAudio(result.audio_base64);
      }

    } catch (err) {
      console.error('음성 처리 오류:', err);
      setError('음성 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // TTS 오디오 재생
  const playTTSAudio = useCallback(async (audioBase64) => {
    try {
      setIsPlaying(true);
      
      // Base64를 Blob으로 변환
      const audioData = atob(audioBase64);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        uint8Array[i] = audioData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // 오디오 재생
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        audioRef.current.onerror = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
          setError('오디오 재생 오류');
        };
        
        await audioRef.current.play();
      }
      
    } catch (err) {
      console.error('TTS 재생 오류:', err);
      setIsPlaying(false);
      setError('음성 재생 중 오류가 발생했습니다.');
    }
  }, []);

  // 텍스트를 음성으로 변환
  const speakText = useCallback(async (text) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/voice/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          language: 'ko',
          speed: 1.0,
          voice_type: 'female'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        setIsPlaying(true);
        await audioRef.current.play();
      }

    } catch (err) {
      console.error('텍스트 음성 변환 오류:', err);
      setError('텍스트 음성 변환 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
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
    isPlaying,
    transcript,
    responseText,
    error,
    audioRef,
    
    // 액션
    startRecording,
    stopRecording,
    speakText,
    
    // 유틸리티
    clearError: () => setError(null),
    clearResults: () => {
      setTranscript('');
      setResponseText('');
    }
  };
};