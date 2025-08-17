import { useState, useRef, useEffect } from 'react';

export const useSSESTT = (roomName, participantName, livekitRoom = null) => {
  // STT 관련 상태 (기본값 true로 변경)
  const [sttEnabled, setSttEnabled] = useState(true);
  const [aiMediationEnabled, setAiMediationEnabled] = useState(true);
  const [coachingEnabled, setCoachingEnabled] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentSpeech, setCurrentSpeech] = useState({ speaker: null, text: '' });
  
  // LiveKit 연결 상태
  const [livekitConnected, setLivekitConnected] = useState(false);
  
  // SSE 연결
  const eventSourceRef = useRef(null);
  const syncIntervalRef = useRef(null);

  // STT 관련 참조
  const recognitionRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const conversationLogRef = useRef([]);
  const lastSentTextRef = useRef('');
  const lastSentTimeRef = useRef(0);
  const processingRef = useRef(false);
  const coachingTimeoutRef = useRef(null);
  const lastCoachingTimeRef = useRef(0);
  const lastSpeechTimeRef = useRef(Date.now());

  // 중복 방지를 위한 메시지 캐시
  const messageCache = useRef(new Set());
  const lastMessageTime = useRef(new Map());

  // 메시지 중복 체크 함수
  const isDuplicateMessage = (speaker, text, source) => {
    const messageKey = `${speaker}:${text}`;
    const now = Date.now();
    
    // 같은 메시지가 2초 내에 왔으면 중복
    if (messageCache.current.has(messageKey)) {
      const lastTime = lastMessageTime.current.get(messageKey) || 0;
      if (now - lastTime < 2000) {
        console.log(`[중복 방지] ${source}에서 중복 메시지 감지:`, text);
        return true;
      }
    }
    
    // 새 메시지로 등록
    messageCache.current.add(messageKey);
    lastMessageTime.current.set(messageKey, now);
    
    // 캐시 정리 (100개 이상이면 오래된 것 삭제)
    if (messageCache.current.size > 100) {
      const oldEntries = Array.from(lastMessageTime.current.entries())
        .filter(([_, time]) => now - time > 60000); // 1분 이상 된 것
      
      oldEntries.forEach(([key, _]) => {
        messageCache.current.delete(key);
        lastMessageTime.current.delete(key);
      });
    }
    
    return false;
  };

  // SSE 연결 초기화
  useEffect(() => {
    if (!roomName) return;
    
    console.log('[SSE STT] 초기화 시작:', roomName, participantName);
    
    // SSE 연결
    const sseUrl = window.location.hostname === 'localhost'
      ? `http://localhost:8002/sse/room/${roomName}/stream`
      : `https://i13c209.p.ssafy.io/ai/sse/room/${roomName}/stream`;
    
    console.log('[SSE STT] 연결 URL:', sseUrl);
    
    eventSourceRef.current = new EventSource(sseUrl);
    
    eventSourceRef.current.onopen = () => {
      console.log('[SSE STT] 연결 성공');
    };
    
    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE STT] 메시지 수신:', data);
        
        if (data.type === 'stt_result') {
          const isMyMessage = data.speaker === participantName;
          
          // 내 메시지는 이미 로컬에서 처리했으므로 스킵
          if (!isMyMessage) {
            // 중복 체크
            if (isDuplicateMessage(data.speaker, data.text, 'SSE')) {
              return;
            }
            
            console.log('[SSE STT] 상대방 메시지 추가:', data);
            const remoteMessage = {
              id: `sse_${Date.now()}_${Math.random()}`,
              speaker: data.speaker,
              text: data.text,
              timestamp: new Date(data.timestamp).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              type: 'remote_stt',
              isRemote: true,
              source: 'sse'
            };
            
            setConversations(prev => [...prev, remoteMessage]);
            conversationLogRef.current.push(remoteMessage);
          }
        }
        
        // 연결 확인 메시지
        if (data.type === 'connected') {
          console.log('[SSE STT] 서버 연결 확인:', data);
        }
      } catch (error) {
        console.error('[SSE STT] 메시지 파싱 오류:', error);
      }
    };
    
    eventSourceRef.current.onerror = (error) => {
      console.error('[SSE STT] 연결 오류:', error);
      
      // 재연결 시도
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          console.log('[SSE STT] 재연결 시도...');
          initSSEConnection();
        }
      }, 5000);
    };
    
    // 초기 동기화 (기존 대화 불러오기)
    syncWithRedis();
    
    // 정기 동기화 (30초마다)
    syncIntervalRef.current = setInterval(async () => {
      await syncWithRedis();
    }, 30000);
    
    return () => {
      console.log('[SSE STT] 정리 시작');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [roomName, participantName]);

  // SSE 연결 초기화 함수
  const initSSEConnection = () => {
    if (!roomName) return;
    
    const sseUrl = window.location.hostname === 'localhost'
      ? `http://localhost:8002/sse/room/${roomName}/stream`
      : `https://i13c209.p.ssafy.io/ai/sse/room/${roomName}/stream`;
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    eventSourceRef.current = new EventSource(sseUrl);
    
    eventSourceRef.current.onopen = () => {
      console.log('[SSE STT] 재연결 성공');
    };
    
    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'stt_result' && data.speaker !== participantName) {
          const remoteMessage = {
            id: Date.now() + Math.random(),
            speaker: data.speaker,
            text: data.text,
            timestamp: new Date(data.timestamp).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            type: 'remote_stt',
            isRemote: true,
            source: 'sse'
          };
          
          setConversations(prev => [...prev, remoteMessage]);
          conversationLogRef.current.push(remoteMessage);
        }
      } catch (error) {
        console.error('[SSE STT] 재연결 메시지 파싱 오류:', error);
      }
    };
  };

  // LiveKit Room 변경 시 Data Channel 초기화
  useEffect(() => {
    if (livekitRoom && sttEnabled) {
      initLivekitDataChannel();
    }
  }, [livekitRoom, sttEnabled]);

  // LiveKit Data Channel 설정
  const initLivekitDataChannel = () => {
    if (!livekitRoom) {
      console.log('[LiveKit STT] Room 객체가 없습니다');
      return false;
    }

    try {
      console.log('[LiveKit STT] Data Channel 초기화');
      
      // 기존 리스너 제거
      livekitRoom.removeAllListeners('dataReceived');
      
      // LiveKit Room의 Data 이벤트 리스너 등록 (보조 역할)
      livekitRoom.on('dataReceived', (payload, participant) => {
        try {
          const decoder = new TextDecoder();
          const dataString = decoder.decode(payload);
          const data = JSON.parse(dataString);
          
          console.log('[LiveKit STT] 데이터 수신 (보조):', data);
          
          // SSE가 주 역할, LiveKit은 보조 역할
          if (data.type === 'stt_result' && data.speaker !== participantName) {
            console.log('[LiveKit STT] 보조 데이터 처리 중...');
            // SSE에서 처리하므로 여기서는 로그만
          }
        } catch (error) {
          console.error('[LiveKit STT] 데이터 파싱 오류:', error);
        }
      });

      setLivekitConnected(true);
      console.log('[LiveKit STT] Data Channel 초기화 완료');
      return true;
    } catch (error) {
      console.error('[LiveKit STT] Data Channel 초기화 실패:', error);
      return false;
    }
  };

  // Redis 동기화
  const syncWithRedis = async () => {
    if (!roomName) return;
    
    try {
      const apiUrl = window.location.hostname === 'localhost'
        ? `http://localhost:8002/sse/room/${roomName}/recent`
        : `https://i13c209.p.ssafy.io/ai/sse/room/${roomName}/recent`;
      
      console.log('[Redis Sync] 동기화 시작:', apiUrl);
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        console.log('[Redis Sync] 동기화 데이터:', data);
        
        if (data.conversations && data.conversations.length > 0) {
          const redisConversations = data.conversations.map(conv => ({
            id: `redis_${conv.id || Date.now()}_${Math.random()}`,
            speaker: conv.speaker,
            text: conv.text,
            timestamp: new Date().toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            type: conv.speaker === participantName ? 'my_stt' : 'remote_stt',
            isRemote: conv.speaker !== participantName,
            source: 'redis'
          }));
          
          setConversations(prev => {
            // 기존 데이터와 병합 (중복 제거)
            const merged = [...prev];
            
            redisConversations.forEach(newConv => {
              const exists = merged.some(existing => 
                existing.speaker === newConv.speaker && 
                existing.text === newConv.text
              );
              
              if (!exists) {
                merged.push(newConv);
              }
            });
            
            // 시간순 정렬
            return merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          });
        }
      }
    } catch (error) {
      console.error('[Redis Sync] 동기화 실패:', error);
    }
  };

  // LiveKit Data Channel로 STT 결과 전송
  const sendSTTToLiveKit = (speaker, text) => {
    if (!livekitRoom || !livekitConnected) {
      console.log('[LiveKit STT] Room이 연결되지 않음');
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const message = {
        type: 'stt_result',
        speaker: speaker,
        text: text,
        timestamp: new Date().toISOString(),
        roomId: roomName
      };
      
      const data = encoder.encode(JSON.stringify(message));
      
      livekitRoom.localParticipant.publishData(data, { 
        reliable: true,
        topic: 'stt'
      });
      
      console.log('[LiveKit STT] 데이터 전송 완료:', message);
      return true;
    } catch (error) {
      console.error('[LiveKit STT] 데이터 전송 실패:', error);
      return false;
    }
  };

  // STT 데이터를 FastAPI로 전송
  const sendSTTToFastAPI = async (speaker, text) => {
    try {
      const payload = {
        roomId: roomName,
        speakerId: speaker,
        text: text,
        timestamp: new Date().toISOString()
      };

      console.log('[STT] FastAPI로 전송:', payload);
      
      const apiUrl = window.location.hostname === 'localhost'
        ? '/ai/speech/process-conflict-chunk'
        : 'https://i13c209.p.ssafy.io/ai/speech/process-conflict-chunk';
      
      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('[STT] FastAPI 전송 성공');
    } catch (error) {
      console.error('[STT] FastAPI 전송 실패:', error);
    }
  };

  // 음성 인식 결과 처리
  const handleSpeechResult = async (finalText) => {
    const trimmedText = finalText.trim();
    
    if (!trimmedText || trimmedText.length < 2) {
      console.log('[STT] 텍스트가 너무 짧음:', trimmedText);
      return;
    }

    // 중복 방지
    const now = Date.now();
    if (trimmedText === lastSentTextRef.current && now - lastSentTimeRef.current < 2000) {
      console.log('[STT] 중복 텍스트 무시:', trimmedText);
      return;
    }

    lastSentTextRef.current = trimmedText;
    lastSentTimeRef.current = now;

    // 1. 내 STT를 즉시 화면에 추가
    const myMessage = {
      id: Date.now(),
      speaker: participantName,
      text: trimmedText,
      timestamp: new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      type: 'my_stt',
      isLocal: true,
      source: 'local'
    };
    
    setConversations(prev => [...prev, myMessage]);
    conversationLogRef.current.push(myMessage);

    // 2. LiveKit으로 즉시 전송 (상대방 빠른 UI 업데이트)
    sendSTTToLiveKit(participantName, trimmedText);

    // 3. FastAPI로 전송 (Redis 저장)
    await sendSTTToFastAPI(participantName, trimmedText);

    // 4. 코칭 분석 (활성화된 경우)
    if (aiMediationEnabled || coachingEnabled) {
      await checkCoachingNeeded();
    }

    // 현재 발언 초기화
    setCurrentSpeech({ speaker: null, text: '' });
    lastSpeechTimeRef.current = Date.now();
  };

  // 코칭 필요 여부 체크
  const checkCoachingNeeded = async () => {
    const now = Date.now();
    if (now - lastCoachingTimeRef.current < 5000) {
      return; // 5초 쿨다운
    }

    try {
      const recentConversations = conversationLogRef.current.slice(-10);
      
      if (recentConversations.length < 3) {
        return;
      }

      const coachingApiUrl = window.location.hostname === 'localhost'
        ? '/ai/speech/coaching/realtime'
        : 'https://i13c209.p.ssafy.io/ai/speech/coaching/realtime';
      
      const response = await fetch(coachingApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: recentConversations.map(c => ({
            speaker: c.speaker,
            text: c.text
          })),
          roomId: roomName,
          silenceDuration: (Date.now() - lastSpeechTimeRef.current) / 1000
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.coachingNeeded && result.coachingMessage) {
          const coaching = {
            id: Date.now(),
            speaker: '참견도치',
            text: result.coachingMessage,
            timestamp: new Date().toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            type: 'coaching',
            isCoachingMessage: true,
            urgency: result.urgency,
            triggerType: result.triggerType
          };
          
          setConversations(prev => [...prev, coaching]);
          lastCoachingTimeRef.current = now;
        }
      }
    } catch (error) {
      console.error('[코칭] 분석 실패:', error);
    }
  };

  // 음성 인식 시작
  const startSTT = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';

    recognition.onstart = () => {
      console.log('[STT] 음성 인식 시작');
      setSttEnabled(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        handleSpeechResult(finalTranscript);
      }

      if (interimTranscript) {
        setCurrentSpeech({
          speaker: participantName,
          text: interimTranscript
        });
      }

      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }

      speechTimeoutRef.current = setTimeout(() => {
        if (interimTranscript && !finalTranscript) {
          handleSpeechResult(interimTranscript);
        }
      }, 2000);
    };

    recognition.onerror = (event) => {
      console.error('[STT] 음성 인식 오류:', event.error);
      if (event.error === 'not-allowed') {
        alert('마이크 권한이 필요합니다.');
      }
    };

    recognition.onend = () => {
      console.log('[STT] 음성 인식 종료');
      setSttEnabled(false);
      
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // 음성 인식 중지
  const stopSTT = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setSttEnabled(false);
    
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
  };

  // STT 토글
  const toggleSTT = () => {
    if (sttEnabled) {
      stopSTT();
    } else {
      startSTT();
    }
  };

  // AI 중재 토글
  const toggleAIMediation = () => {
    setAiMediationEnabled(!aiMediationEnabled);
    console.log('[AI 중재]', !aiMediationEnabled ? '활성화' : '비활성화');
  };

  // 코칭 토글
  const toggleCoaching = () => {
    setCoachingEnabled(!coachingEnabled);
    console.log('[코칭]', !coachingEnabled ? '활성화' : '비활성화');
  };

  return {
    // 상태
    sttEnabled,
    aiMediationEnabled,
    coachingEnabled,
    currentSpeech,
    
    // 대화 데이터
    conversations,
    
    // 함수
    toggleSTT,
    toggleAIMediation,
    toggleCoaching,
    startSTT,
    stopSTT,
    handleSpeechResult,
    sendSTTToFastAPI,
    sendSTTToLiveKit,
    checkCoachingNeeded,
    syncWithRedis,
    
    // Refs (필요시)
    recognitionRef,
    speechTimeoutRef,
    conversationLogRef
  };
};