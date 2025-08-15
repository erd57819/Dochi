// hooks/useKafkaMetrics.js
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Kafka 메트릭 전송 훅
 * VideoCallRoom의 기존 기능과 완전히 분리됨
 * KAFKA_ENABLED=false일 때는 동작하지 않음
 */
export const useKafkaMetrics = (roomId, isConnected = false, participants = []) => {
  const [metricsEnabled, setMetricsEnabled] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const intervalRef = useRef(null);
  
  // Kafka 기능 활성화 상태 확인
  useEffect(() => {
    // 환경 변수나 설정으로 Kafka 기능 활성화 여부 확인
    const checkKafkaStatus = async () => {
      try {
        const response = await fetch('/api/kafka/health');
        if (response.ok) {
          setMetricsEnabled(true);
          console.log('[Kafka Metrics] 확장성 메트릭 기능 활성화됨');
        }
      } catch (error) {
        // Kafka가 비활성화되어 있거나 오류 시 조용히 실패
        console.log('[Kafka Metrics] 확장성 기능 비활성화 상태');
        setMetricsEnabled(false);
      }
    };
    
    checkKafkaStatus();
  }, []);

  // 방 메트릭 전송 함수
  const sendRoomMetrics = useCallback(async (customData = {}) => {
    if (!metricsEnabled || !roomId || !isConnected) {
      return; // 조용히 실패 (기존 기능에 영향 없음)
    }

    try {
      const metricsData = {
        roomId: roomId,
        participantCount: participants.length + 1, // 나 + 참가자들
        callDurationSeconds: Math.floor(Date.now() / 1000), // 임시값
        conflictLevel: Math.floor(Math.random() * 100), // 실제로는 감정 분석에서 가져와야 함
        totalMessages: Math.floor(Math.random() * 50), // STT 메시지 수
        avgEmotionScore: Math.random(), // 평균 감정 점수
        timestamp: new Date().toISOString(),
        roomStatus: 'ACTIVE',
        priority: 1,
        metadata: JSON.stringify({
          source: 'VideoCallRoom',
          version: '2.0',
          demo: true,
          ...customData
        }),
        ...customData // 추가 데이터 병합
      };

      const response = await fetch('/api/kafka/room-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metricsData)
      });

      if (response.ok) {
        const result = await response.json();
        setSentCount(prev => prev + 1);
        console.log(`[Kafka Metrics] 방 메트릭 전송 성공: ${roomId} (${sentCount + 1}번째)`);
        return result;
      }
    } catch (error) {
      // 오류가 발생해도 기존 VideoCall 기능에 영향을 주지 않음
      console.warn('[Kafka Metrics] 메트릭 전송 실패 (서비스 영향 없음):', error.message);
    }
  }, [metricsEnabled, roomId, isConnected, participants.length, sentCount]);

  // 사용자 활동 전송 함수
  const sendUserActivity = useCallback(async (activityType, userId, additionalData = {}) => {
    if (!metricsEnabled || !roomId) {
      return;
    }

    try {
      const activityData = {
        roomId: roomId,
        userId: userId || 'anonymous',
        activityType: activityType, // JOIN, LEAVE, SPEAK, MUTE, UNMUTE
        speakDuration: additionalData.duration || null,
        emotionState: additionalData.emotion || 'NEUTRAL',
        volumeLevel: additionalData.volume || Math.floor(Math.random() * 100),
        timestamp: new Date().toISOString(),
        sessionId: `session-${Date.now()}`,
        deviceInfo: navigator.userAgent,
        contextData: JSON.stringify({
          participants: participants.length,
          ...additionalData
        })
      };

      const response = await fetch('/api/kafka/user-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData)
      });

      if (response.ok) {
        console.log(`[Kafka Metrics] 사용자 활동 전송: ${activityType} by ${userId}`);
        return await response.json();
      }
    } catch (error) {
      console.warn('[Kafka Metrics] 활동 전송 실패:', error.message);
    }
  }, [metricsEnabled, roomId, participants.length]);

  // 주기적 메트릭 전송 시작
  const startPeriodicMetrics = useCallback((intervalMs = 10000) => {
    if (!metricsEnabled || intervalRef.current) {
      return; // 이미 실행 중이거나 비활성화됨
    }

    console.log(`[Kafka Metrics] 주기적 메트릭 전송 시작: ${intervalMs}ms 간격`);

    intervalRef.current = setInterval(() => {
      sendRoomMetrics({
        periodicUpdate: true,
        updateNumber: Math.floor(Date.now() / intervalMs)
      });
    }, intervalMs);
  }, [metricsEnabled, sendRoomMetrics]);

  // 주기적 메트릭 전송 중단
  const stopPeriodicMetrics = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('[Kafka Metrics] 주기적 메트릭 전송 중단');
    }
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopPeriodicMetrics();
    };
  }, [stopPeriodicMetrics]);

  // 연결 상태 변화에 따른 메트릭 관리
  useEffect(() => {
    if (isConnected && metricsEnabled) {
      // 통화 시작 시 주기적 전송 시작
      startPeriodicMetrics();
      
      // 입장 활동 기록
      sendUserActivity('JOIN', 'current-user', {
        timestamp: new Date().toISOString()
      });
    } else {
      // 통화 종료 시 주기적 전송 중단
      stopPeriodicMetrics();
    }

    return () => {
      stopPeriodicMetrics();
    };
  }, [isConnected, metricsEnabled, startPeriodicMetrics, stopPeriodicMetrics, sendUserActivity]);

  return {
    metricsEnabled,
    sentCount,
    sendRoomMetrics,
    sendUserActivity,
    startPeriodicMetrics,
    stopPeriodicMetrics
  };
};