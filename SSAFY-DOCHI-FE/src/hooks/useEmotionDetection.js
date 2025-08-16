import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import apiClient from '../config/axios';

export const useEmotionDetection = (roomName, participantName) => {
  // 표정 감정 관련 상태
  const [emotionScores, setEmotionScores] = useState({});
  const [conflictLevel, setConflictLevel] = useState(0);

  // 표정 감정 관련 참조
  const emotionDetectionInterval = useRef(null);
  const emotionAccumulatorRef = useRef({});
  const lastEmotionSentTimeRef = useRef(0);

  // Face-API 모델 로드
  const loadFaceApiModels = async () => {
    try {
      console.log('Face-API 모델 로딩 시작...');

      // CDN에서 모델 로드
      const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
      
      console.log('모델 다운로드 시작:', MODEL_URL);
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);

      console.log('Face-API 모델 로딩 완료');
      return true;
    } catch (error) {
      console.error('Face-API 모델 로딩 실패:', error);
      console.error('에러 상세:', error.message);
      return false;
    }
  };

  // 모델 로드 상태 추가
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // 표정 분석 시작
  const startEmotionDetection = async (videoElement) => {
    console.log('표정 분석 시작 요청...');
    
    // 모델이 로드되지 않았으면 먼저 로드
    if (!isModelLoaded) {
      console.log('Face-API 모델이 로드되지 않음, 로딩 시도...');
      const loadSuccess = await loadFaceApiModels();
      if (!loadSuccess) {
        console.error('Face-API 모델 로딩 실패로 표정 분석 중단');
        return;
      }
      setIsModelLoaded(true);
    }
    
    console.log('표정 분석 시작...');
    
    emotionDetectionInterval.current = setInterval(async () => {
      try {
        if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
          return;
        }

        // 얼굴 감지 및 표정 분석
        const detections = await faceapi
          .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        if (detections && detections.length > 0) {
          const expressions = detections[0].expressions;
          updateEmotionScores(participantName, expressions);
        }
      } catch (error) {
        console.error('표정 분석 중 오류:', error);
      }
    }, 1000); // 1초마다 분석
  };

  // 감정 점수 업데이트 + 5분마다 FastAPI로 전송
  const updateEmotionScores = (participantName, expressions) => {
    const currentTime = Date.now();
    
    const newEmotionScore = {
      angry: Math.round(expressions.angry * 100),
      sad: Math.round(expressions.sad * 100),
      happy: Math.round(expressions.happy * 100),
      surprised: Math.round(expressions.surprised * 100),
      neutral: Math.round(expressions.neutral * 100),
      timestamp: currentTime
    };
    
    // UI 업데이트용
    setEmotionScores(prev => ({
      ...prev,
      [participantName]: newEmotionScore
    }));

    // localStorage에 감정 히스토리 저장 (갈등 레포트용)
    const emotionHistoryKey = `emotion_history_${roomName}`;
    const existingHistory = JSON.parse(localStorage.getItem(emotionHistoryKey) || '{}');
    
    if (!existingHistory[participantName]) {
      existingHistory[participantName] = [];
    }
    
    existingHistory[participantName].push(newEmotionScore);
    
    // 최대 1000개 데이터만 보관 (메모리 절약)
    if (existingHistory[participantName].length > 1000) {
      existingHistory[participantName] = existingHistory[participantName].slice(-1000);
    }
    
    localStorage.setItem(emotionHistoryKey, JSON.stringify(existingHistory));

    // 누적기에 데이터 저장 (5분간 수집)
    if (!emotionAccumulatorRef.current[participantName]) {
      emotionAccumulatorRef.current[participantName] = [];
    }
    
    emotionAccumulatorRef.current[participantName].push({
      angry: expressions.angry,
      sad: expressions.sad,
      happy: expressions.happy,
      surprised: expressions.surprised,
      neutral: expressions.neutral,
      timestamp: currentTime
    });

    // 5분(300초) 경과 시 FastAPI로 전송
    if (currentTime - lastEmotionSentTimeRef.current > 300000) { // 5분 = 300,000ms
      sendAccumulatedEmotionsToFastAPI(participantName);
      lastEmotionSentTimeRef.current = currentTime;
    }
  };

  // 5분간 누적된 표정 데이터에서 최빈 표정을 FastAPI로 전송
  const sendAccumulatedEmotionsToFastAPI = async (participantName) => {
    try {
      const emotionHistory = emotionAccumulatorRef.current[participantName] || [];
      
      if (emotionHistory.length === 0) {
        console.log('[표정] 전송할 데이터가 없습니다.');
        return;
      }

      // 최빈 표정 계산
      const emotionCounts = {
        angry: 0, sad: 0, happy: 0, surprised: 0, neutral: 0
      };

      emotionHistory.forEach(emotion => {
        // 가장 높은 값을 가진 표정 찾기
        const maxEmotion = Object.keys(emotion)
          .filter(key => key !== 'timestamp')
          .reduce((a, b) => emotion[a] > emotion[b] ? a : b);
        
        emotionCounts[maxEmotion]++;
      });

      // 최빈 표정
      const dominantEmotion = Object.keys(emotionCounts)
        .reduce((a, b) => emotionCounts[a] > emotionCounts[b] ? a : b);

      const payload = {
        roomId: roomName,
        speaker: participantName,
        timestamp: new Date().toISOString(),
        emotions: {
          dominant: dominantEmotion,
          frequency: emotionCounts[dominantEmotion],
          all: emotionCounts,
          total_samples: emotionHistory.length
        }
      };

      console.log('[표정] FastAPI로 전송:', payload);
      
      const faceApiUrl = window.location.hostname === 'localhost'
        ? '/ai/emotion/face'  // 로컬 개발 (vite proxy 사용)
        : 'https://i13c209.p.ssafy.io/ai/emotion/face';  // 배포 환경 (직접 연결)
      
      console.log('[표정] 전송 URL:', faceApiUrl);
      
      const response = await fetch(faceApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[표정] FastAPI 전송 성공:', result);
      
      // 누적 데이터 초기화
      emotionAccumulatorRef.current[participantName] = [];
      
    } catch (error) {
      console.error('[표정] FastAPI 전송 실패:', error);
    }
  };

  // 표정 분석 중지
  const stopEmotionDetection = () => {
    if (emotionDetectionInterval.current) {
      clearInterval(emotionDetectionInterval.current);
      emotionDetectionInterval.current = null;
    }
  };

  // 갈등 레벨 분석 (감정 기반)
  const analyzeConflictLevel = (emotionScores) => {
    if (!emotionScores || Object.keys(emotionScores).length === 0) {
      return 0;
    }

    let totalConflictScore = 0;
    let participantCount = 0;

    Object.values(emotionScores).forEach(scores => {
      if (scores) {
        // 부정적 감정 (angry, sad)에 가중치를 두어 갈등 점수 계산
        const negativeScore = (scores.angry || 0) * 0.8 + (scores.sad || 0) * 0.6;
        // 긍정적 감정 (happy)은 갈등 점수를 낮춤
        const positiveScore = (scores.happy || 0) * 0.5;
        // neutral은 중간값으로 처리
        const neutralScore = (scores.neutral || 0) * 0.1;
        
        const conflictScore = Math.max(0, negativeScore - positiveScore + neutralScore);
        totalConflictScore += conflictScore;
        participantCount++;
      }
    });

    const averageConflictLevel = participantCount > 0 ? totalConflictScore / participantCount : 0;
    
    // 0-100 범위로 정규화
    const normalizedLevel = Math.min(100, Math.max(0, averageConflictLevel));
    
    setConflictLevel(normalizedLevel);
    return normalizedLevel;
  };

  // 감정 기반 AI 조언 생성
  const generateEmotionAdvice = (emotionScores, participantName) => {
    if (!emotionScores || !emotionScores[participantName]) {
      return null;
    }

    const scores = emotionScores[participantName];
    const dominantEmotion = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );
    
    const score = scores[dominantEmotion];
    const magnitude = Math.sqrt(Object.values(scores).reduce((sum, val) => sum + val * val, 0));

    const emotionAdvice = {
      angry: {
        icon: '😠',
        message: '화가 나신 것 같네요. 잠시 심호흡을 하고 차분하게 이야기해보세요.',
        advice: '감정이 격해질 때는 "나는 ~때문에 화가 난다"는 방식으로 표현해보세요.'
      },
      sad: {
        icon: '😢', 
        message: '속상하신 것 같아요. 상대방에게 솔직한 마음을 전달해보세요.',
        advice: '슬픈 감정도 소중합니다. "나는 지금 상처받은 기분이야"라고 표현해보세요.'
      },
      happy: {
        icon: '😊',
        message: '좋은 분위기네요! 이런 긍정적인 에너지를 계속 유지해보세요.',
        advice: '행복한 순간을 상대방과 공유하면 관계가 더욱 돈독해집니다.'
      },
      surprised: {
        icon: '😲',
        message: '놀라신 것 같네요. 무슨 일인지 차근차근 이야기해보세요.',
        advice: '놀란 마음을 진정시키고, "잠깐, 이해가 안 되는 부분이 있어"라고 말해보세요.'
      },
      neutral: {
        icon: '😐',
        message: '침착한 상태네요. 지금이 대화를 정리할 좋은 시기인 것 같아요.',
        advice: '중립적인 상태일 때 서로의 입장을 정리하고 해결책을 찾아보세요.'
      }
    };

    const emotionState = dominantEmotion;
    const emotionIcon = emotionAdvice[emotionState]?.icon || '😐';
    const advice = emotionAdvice[emotionState]?.advice || '대화를 계속해보세요.';

    // 감정 강도에 따른 추가 메시지
    let intensityMessage = '';
    if (magnitude > 70) {
      intensityMessage = ' 감정이 매우 강한 상태입니다. 잠시 휴식을 취하는 것이 어떨까요?';
    } else if (magnitude > 40) {
      intensityMessage = ' 감정이 어느 정도 높은 상태네요. 천천히 대화해보세요.';
    }

    return {
      emotion: emotionState,
      score: score,
      magnitude: magnitude,
      icon: emotionIcon,
      advice: advice + intensityMessage,
      rawScores: scores,
      rawMagnitude: magnitude
    };
  };

  // 통화 종료 시 남은 감정 데이터 전송
  const sendFinalEmotionData = async () => {
    try {
      const participantNames = Object.keys(emotionAccumulatorRef.current);
      for (const participantName of participantNames) {
        const emotionHistory = emotionAccumulatorRef.current[participantName] || [];
        if (emotionHistory.length > 0) {
          console.log(`[통화종료] ${participantName}의 남은 표정 데이터 전송 중...`);
          await sendAccumulatedEmotionsToFastAPI(participantName);
        }
      }
    } catch (error) {
      console.error('[통화종료] 최종 표정 데이터 전송 실패:', error);
    }
  };

  // 초기화
  useEffect(() => {
    loadFaceApiModels();
  }, []);

  return {
    // 상태
    emotionScores,
    conflictLevel,

    // 참조 (필요한 경우 외부에서 접근)
    emotionAccumulatorRef,
    lastEmotionSentTimeRef,

    // 함수
    startEmotionDetection,
    stopEmotionDetection,
    updateEmotionScores,
    sendAccumulatedEmotionsToFastAPI,
    analyzeConflictLevel,
    generateEmotionAdvice,
    sendFinalEmotionData
  };
};