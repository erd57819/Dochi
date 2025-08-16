import { useState, useRef, useEffect } from 'react';

export const useSTTEnhanced = (roomName, participantName, livekitRoom = null) => {
  // 이중 배열 관리 - 모든 대화와 내 코칭 분리
  const [allConversations, setAllConversations] = useState([]); // 모든 STT (나+상대방)
  const [myCoachings, setMyCoachings] = useState([]); // 내 코칭만
  
  // STT 관련 상태
  const [sttEnabled, setSttEnabled] = useState(false);
  const [aiMediationEnabled, setAiMediationEnabled] = useState(false);
  const [coachingEnabled, setCoachingEnabled] = useState(false);
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

  // SSE 연결 초기화
  useEffect(() => {
    if (!roomName) return;
    
    // SSE 연결
    const sseUrl = window.location.hostname === 'localhost'
      ? `http://localhost:8002/sse/room/${roomName}/stream`
      : `https://i13c209.p.ssafy.io/ai/sse/room/${roomName}/stream`;
    
    console.log('[SSE] 연결 시작:', sseUrl);
    
    eventSourceRef.current = new EventSource(sseUrl);
    
    eventSourceRef.current.onopen = () => {
      console.log('[SSE] 연결 성공');
    };
    
    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE] 메시지 수신:', data);
        
        if (data.type === 'stt_result' && data.speaker !== participantName) {
          // 상대방 STT 수신
          const remoteMessage = {
            id: Date.now() + Math.random(),
            speaker: data.speaker,
            text: data.text,
            timestamp: data.timestamp || new Date().toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            type: 'other_stt',
            isRemote: true
          };
          
          setAllConversations(prev => [...prev, remoteMessage]);
          conversationLogRef.current.push(remoteMessage);
        }
      } catch (error) {
        console.error('[SSE] 메시지 파싱 오류:', error);
      }
    };
    
    eventSourceRef.current.onerror = (error) => {
      console.error('[SSE] 연결 오류:', error);
    };
    
    // Redis 동기화 (5초마다)
    syncIntervalRef.current = setInterval(async () => {
      await syncWithRedis();
    }, 5000);
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [roomName, participantName]);

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
      
      // LiveKit Room의 Data 이벤트 리스너 등록
      livekitRoom.on('dataReceived', (payload, participant) => {
        try {
          const decoder = new TextDecoder();
          const dataString = decoder.decode(payload);
          const data = JSON.parse(dataString);
          
          console.log('[LiveKit STT] 데이터 수신:', data, 'from:', participant?.identity);
          
          // 상대방의 STT 결과 (빠른 UI 업데이트용)
          if (data.type === 'stt_result' && data.speaker !== participantName) {
            const remoteMessage = {
              id: Date.now() + Math.random(),
              speaker: data.speaker,
              text: data.text,
              timestamp: data.timestamp || new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              type: 'other_stt',
              isRemote: true,
              source: 'livekit'
            };
            
            // LiveKit 데이터는 임시로 표시 (Redis 동기화 시 덮어씌워짐)
            setAllConversations(prev => {
              // 중복 체크
              const exists = prev.some(c => 
                c.speaker === data.speaker && 
                c.text === data.text && 
                Math.abs(Date.now() - new Date(c.timestamp).getTime()) < 2000
              );
              
              if (!exists) {
                return [...prev, remoteMessage];
              }
              return prev;
            });
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
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        console.log('[Redis Sync] 동기화 데이터:', data);
        
        // Redis 데이터로 전체 대화 업데이트 (진실의 소스)
        if (data.conversations && data.conversations.length > 0) {
          // 기존 LiveKit 데이터와 병합
          setAllConversations(prev => {
            const redisConversations = data.conversations.map(conv => ({
              ...conv,
              type: conv.speaker === participantName ? 'my_stt' : 'other_stt',
              isRemote: conv.speaker !== participantName
            }));
            
            // 최근 것만 유지 (중복 제거)
            const merged = [...redisConversations];
            const uniqueMap = new Map();
            
            merged.forEach(conv => {
              const key = `${conv.speaker}_${conv.text}`;
              if (!uniqueMap.has(key)) {
                uniqueMap.set(key, conv);
              }
            });
            
            return Array.from(uniqueMap.values());
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
      
      // LiveKit publishData 사용
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
      isLocal: true
    };
    
    setAllConversations(prev => [...prev, myMessage]);
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
            type: 'my_coaching',
            isCoachingMessage: true,
            urgency: result.urgency,
            triggerType: result.triggerType
          };
          
          // 내 코칭 목록에 추가
          setMyCoachings(prev => [...prev, coaching]);
          
          // 전체 대화에도 추가 (선택적)
          setAllConversations(prev => [...prev, {
            ...coaching,
            text: `💡 ${result.coachingMessage}`
          }]);
          
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
    
    // 대화 데이터 (이중 배열)
    allConversations,     // 모든 STT (나+상대방)
    myCoachings,          // 내 코칭만
    conversations: allConversations, // 기존 호환성
    
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