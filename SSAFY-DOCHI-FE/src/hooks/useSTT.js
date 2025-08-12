import { useState, useRef, useEffect } from 'react';
import apiClient from '../config/axios';

export const useSTT = (roomName, participantName, livekitRoom = null) => {
  // STT 관련 상태
  const [sttEnabled, setSttEnabled] = useState(false);
  const [aiMediationEnabled, setAiMediationEnabled] = useState(false);
  const [coachingEnabled, setCoachingEnabled] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentSpeech, setCurrentSpeech] = useState({ speaker: null, text: '' });
  
  // LiveKit 연결 상태
  const [livekitConnected, setLivekitConnected] = useState(false);

  // STT 관련 참조
  const recognitionRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const conversationLogRef = useRef([]);
  const lastSentTextRef = useRef(''); // 마지막 전송된 텍스트 저장
  const lastSentTimeRef = useRef(0); // 마지막 전송 시간
  const processingRef = useRef(false); // 처리 중 플래그
  const coachingTimeoutRef = useRef(null);
  const lastCoachingTimeRef = useRef(0);
  const lastSpeechTimeRef = useRef(Date.now()); // 마지막 발언 시간
  const silenceCheckTimeoutRef = useRef(null); // 침묵 체크 타이머
  const uiDisplayTimeoutRef = useRef(null); // UI 표시용 타이머
  const apiSendTimeoutRef = useRef(null); // API 전송용 타이머

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
      
      // LiveKit Room의 Data 이벤트 리스너 등록
      livekitRoom.on('dataReceived', (payload, participant) => {
        try {
          const decoder = new TextDecoder();
          const dataString = decoder.decode(payload);
          const data = JSON.parse(dataString);
          
          console.log('[LiveKit STT] 데이터 수신:', data, 'from:', participant?.identity);
          
          // 상대방의 STT 결과를 받아서 화면에 추가
          if (data.type === 'stt_result' && data.speaker !== participantName) {
            const remoteConversation = {
              id: Date.now() + Math.random(),
              speaker: data.speaker,
              text: data.text,
              timestamp: new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              aiSuggestion: null,
              isRemote: true
            };
            
            setConversations(prev => [...prev, remoteConversation]);
            conversationLogRef.current.push(remoteConversation);
            console.log('[LiveKit STT] 상대방 발언 추가:', remoteConversation);
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

  // LiveKit Data Channel로 STT 결과 전송
  const sendSTTToLiveKit = (speaker, text) => {
    console.log('[LiveKit STT] 전송 시도:', {
      hasRoom: !!livekitRoom,
      isConnected: livekitConnected,
      roomName: livekitRoom?.name,
      roomState: livekitRoom?.state
    });
    
    if (!livekitRoom || !livekitConnected) {
      console.log('[LiveKit STT] Room이 연결되지 않음');
      return false;
    }

    try {
      const message = {
        type: 'stt_result',
        speaker: speaker,
        text: text,
        roomId: roomName,
        timestamp: new Date().toISOString()
      };
      
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(message));
      
      livekitRoom.localParticipant.publishData(data, { reliable: true });
      console.log('[LiveKit STT] 전송:', message);
      return true;
    } catch (error) {
      console.error('[LiveKit STT] 전송 실패:', error);
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
        ? '/ai/speech/process-conflict-chunk'  // 로컬 개발 (vite proxy 사용)
        : 'https://i13c209.p.ssafy.io/ai/speech/process-conflict-chunk';  // 배포 환경 (직접 연결)
      
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
  const handleSpeechResult = async (speaker, text) => {
    const currentTime = Date.now();
    const trimmedText = text.trim();
    
    // 처리 중이면 스킵
    if (processingRef.current) {
      console.log('[STT] 이미 처리 중, 전송 스킵:', trimmedText);
      return;
    }

    // 중복 전송 방지: 마지막에 전송한 텍스트와 동일하거나 2초 내 재전송이면 스킵
    if (lastSentTextRef.current === trimmedText || 
        (currentTime - lastSentTimeRef.current < 2000 && lastSentTextRef.current.includes(trimmedText))) {
      console.log('[STT] 중복 텍스트 감지, 전송 스킵:', trimmedText);
      return;
    }

    // 너무 짧은 텍스트는 무시 (노이즈 방지)
    if (trimmedText.length < 2) {
      console.log('[STT] 텍스트가 너무 짧음, 전송 스킵:', trimmedText);
      return;
    }

    // 처리 시작
    processingRef.current = true;
    lastSentTextRef.current = trimmedText;
    lastSentTimeRef.current = currentTime;
    
    try {
      const timestamp = new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const newConversation = {
        id: Date.now(),
        speaker,
        text: trimmedText,
        timestamp,
        aiSuggestion: null
      };

      setConversations(prev => [...prev, newConversation]);
      conversationLogRef.current.push(newConversation);

      // 발언 시간 업데이트 (침묵 추적용)
      lastSpeechTimeRef.current = currentTime;
      
      // 기존 침묵 체크 타이머 초기화
      if (silenceCheckTimeoutRef.current) {
        clearTimeout(silenceCheckTimeoutRef.current);
      }
      
      // 새로운 침묵 체크 타이머 시작
      if (coachingEnabled) {
        startSilenceMonitoring();
      }

      // LiveKit Data Channel로 실시간 전송 (상대방 화면에 즉시 표시)
      sendSTTToLiveKit(speaker, trimmedText);

      // FastAPI로 STT 데이터 전송 (한 화자가 말이 끝났을 때)
      await sendSTTToFastAPI(speaker, trimmedText);

      // 코칭 분석 수행 (항상 실행)
      await checkCoachingNeeded();
    } finally {
      // 처리 완료
      processingRef.current = false;
    }

    // 프론트엔드 갈등 감지 및 AI 중재 기능 제거 (Google API만 사용)
    // const shouldMediate = await analyzeConflictAndTiming(text, speaker);
    // if (shouldMediate && aiMediationEnabled) {
    //   try {
    //     const suggestion = await getAISuggestion(text, speaker);
    //     setConversations(prev => 
    //       prev.map(conv => 
    //         conv.id === newConversation.id 
    //           ? { ...conv, aiSuggestion: suggestion }
    //           : conv
    //       )
    //     );
    //   } catch (error) {
    //     console.error('AI 중재 요청 실패:', error);
    //   }
    // }
  };

  // 갈등 분석 및 중재 타이밍 결정
  const analyzeConflictAndTiming = async (text, speaker) => {
    try {
      // 갈등 키워드 검사
      const conflictKeywords = [
        // 직접적 갈등 표현
        '화가', '짜증', '열받', '빡쳐', '미쳐', '싫어', '쓰레기', '바보', '멍청', 
        '어이없', '말도 안돼', '황당', '어떻게', '진짜', 'seriously',
        
        // 부정적 감정
        '스트레스', '답답', '막막', '속상', '서운', '실망', '억울', '불공평',
        '불만', '문제', '잘못', '틀렸', '거짓말', '속였',
        
        // 갈등 상황
        '다투', '싸우', '논쟁', '반대', '거부', '거절', '안해', '못해', '싫어',
        '그만', '끝', '포기', '힘들', '지쳤', '안되', '불가능',
        
        // 관계 갈등
        '네 탓', '너 때문', '니가', '당신이', '책임', '잘못한', '문제있',
        '이해 못해', '말이 안돼', '납득 안돼'
      ];

      const hasConflictKeyword = conflictKeywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );

      // 감정적 구두점 패턴 검사 (여러 느낌표, 물음표)
      const emotionalPunctuation = /[!]{2,}|[?]{2,}|[!?]{2,}/.test(text);

      // 대문자 사용 패턴 (강조)
      const hasEmphasis = /[A-Z]{3,}/.test(text) || text.length > 0 && text === text.toUpperCase();

      // 부정문 패턴
      const negativePatterns = [
        '안 ', '않 ', '못 ', '안해', '안돼', '안되', '아니', '아닐', '절대',
        'no', 'never', 'not', 'dont', 'can\'t', 'won\'t'
      ];
      const hasNegative = negativePatterns.some(pattern => 
        text.toLowerCase().includes(pattern.toLowerCase())
      );

      // 갈등 점수 계산
      let conflictScore = 0;
      if (hasConflictKeyword) conflictScore += 3;
      if (emotionalPunctuation) conflictScore += 2;
      if (hasEmphasis) conflictScore += 2;
      if (hasNegative) conflictScore += 1;

      // 텍스트 길이와 감정 강도 고려
      if (text.length > 50) conflictScore += 1; // 긴 발언은 감정이 격해질 가능성
      
      console.log(`갈등 분석 - 화자: ${speaker}, 점수: ${conflictScore}, 텍스트: "${text}"`);
      
      // 갈등 점수가 3 이상이면 중재 필요
      return conflictScore >= 3;
    } catch (error) {
      console.error('갈등 분석 실패:', error);
      return false;
    }
  };


  // 코칭 분석 요청 함수
  const checkCoachingNeeded = async () => {
    try {
      // 최근 대화 데이터 준비 (최근 5개)
      const recentConversations = conversationLogRef.current.slice(-5).map(conv => ({
        speaker: conv.speaker,
        text: conv.text
      }));

      if (recentConversations.length < 2) {
        console.log('[코칭] 대화가 충분하지 않음');
        return;
      }

      const coachingApiUrl = window.location.hostname === 'localhost'
        ? '/ai/speech/coaching/realtime'
        : 'https://i13c209.p.ssafy.io/ai/speech/coaching/realtime';
      
      // 침묵 시간 계산
      const silenceDuration = (Date.now() - lastSpeechTimeRef.current) / 1000;
      
      const response = await fetch(coachingApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: recentConversations,
          roomId: roomName,
          silenceDuration: silenceDuration
        })
      });

      const coachingResult = await response.json();
      console.log('[코칭 분석 결과]', coachingResult);

      if (coachingResult.coachingNeeded && coachingResult.coachingMessage) {
        // 중복 코칭 방지 (30초 이내 재알림 방지)
        const now = Date.now();
        if (now - lastCoachingTimeRef.current < 30000) {
          console.log('[코칭] 중복 방지 - 최근에 코칭함');
          return;
        }

        lastCoachingTimeRef.current = now;

        // 코칭 메시지를 채팅창에 표시
        setConversations(prev => [...prev, {
          id: Date.now() + 10,
          speaker: 'AI 코치',
          text: coachingResult.coachingMessage,
          timestamp: new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          isCoachingMessage: true,
          triggerType: coachingResult.triggerType,
          urgency: coachingResult.urgency
        }]);

        console.log(`[코칭 제공] ${coachingResult.triggerType} - ${coachingResult.urgency}`);
      }

      // 다음 체크 주기 설정
      if (coachingTimeoutRef.current) {
        clearTimeout(coachingTimeoutRef.current);
      }

      const nextInterval = coachingResult.nextCheckInterval || 60;
      coachingTimeoutRef.current = setTimeout(() => {
        if (coachingEnabled && conversationLogRef.current.length > 0) {
          checkCoachingNeeded();
        }
      }, nextInterval * 1000);

    } catch (error) {
      console.error('[코칭 분석 실패]', error);
    }
  };

  // 침묵 모니터링 시작
  const startSilenceMonitoring = () => {
    // 15초 후 첫 번째 침묵 체크
    silenceCheckTimeoutRef.current = setTimeout(() => {
      checkSilenceCoaching(15);
    }, 15000);
  };

  // 침묵 기반 코칭 체크
  const checkSilenceCoaching = async (expectedSilence) => {
    if (!coachingEnabled) return;
    
    const actualSilence = (Date.now() - lastSpeechTimeRef.current) / 1000;
    
    // 실제 침묵 시간이 예상보다 짧으면 (중간에 발언이 있었으면) 체크 안 함
    if (actualSilence < expectedSilence - 2) {
      console.log(`[침묵 체크] 중간에 발언 있음 (예상: ${expectedSilence}s, 실제: ${actualSilence.toFixed(1)}s)`);
      return;
    }
    
    console.log(`[침묵 체크] ${actualSilence.toFixed(1)}초 침묵 감지`);
    
    // 침묵 기반 코칭 체크 (대화 없어도 침묵만으로 체크 가능)
    await checkCoachingNeeded();
    
    // 다음 침묵 체크 설정
    if (actualSilence >= 15 && actualSilence < 30) {
      // 20초 체크
      silenceCheckTimeoutRef.current = setTimeout(() => {
        checkSilenceCoaching(20);
      }, 5000);
    } else if (actualSilence >= 20 && actualSilence < 30) {
      // 30초 체크  
      silenceCheckTimeoutRef.current = setTimeout(() => {
        checkSilenceCoaching(30);
      }, 10000);
    }
  };


  // AI 조언 요청
  const getAISuggestion = async (text, speaker) => {
    try {
      const conversationHistory = conversationLogRef.current
        .slice(-5) // 최근 5개 대화만 포함
        .map(conv => `${conv.speaker}: ${conv.text}`)
        .join('\n');

      const response = await apiClient.post('/ai/mediate', {
        currentText: text,
        speaker: speaker,
        conversationHistory: conversationHistory,
        roomId: roomName
      });

      if (response.data && response.data.suggestion) {
        return response.data.suggestion;
      }
      return null;
    } catch (error) {
      console.error('AI 조언 요청 실패:', error);
      return null;
    }
  };

  // STT 초기화
  const initSTT = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('브라우저가 음성 인식을 지원하지 않습니다.');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';
    recognition.maxAlternatives = 1;

    let finalTranscript = '';
    let isProcessing = false;
    let currentSpeaker = participantName;
    let lastProcessTime = Date.now();
    let speakerQueue = []; // 최근 화자 이력
    let activeSpeaker = participantName; // 현재 실제로 말하고 있는 화자
    let uiDisplayTimeout = null; // UI 표시용 타이머
    let apiSendTimeout = null; // API 전송용 타이머

    let lastSpeechTime = Date.now();
    let silenceTimer = null;

    // 한국어 문장 끝 패턴
    const koreanSentenceEnders = {
      // 강한 종결: 즉시 처리 (0.3초)
      strong: /[.!?]$|요\s*$|다\s*$|까\s*$|죠\s*$|해\s*$/,
      // 약한 종결: 짧은 대기 (0.5초)  
      weak: /네\s*$|예\s*$|그래\s*$|아니\s*$|맞아\s*$|좋아\s*$|알겠어\s*$/,
      // 중간 쉼: 보통 대기 (0.8초)
      pause: /그런데\s*$|그리고\s*$|그래서\s*$|근데\s*$|그냥\s*$/
    };

    const processSentence = async (text) => {
      const trimmedText = text.trim();
      
      if (trimmedText && !isProcessing && !processingRef.current) {
        // 중복 체크 - 같은 텍스트가 이미 처리 중이면 스킵
        if (lastSentTextRef.current === trimmedText) {
          console.log('[processSentence] 중복 텍스트 스킵:', trimmedText);
          return;
        }
        
        isProcessing = true;
        currentSpeaker = activeSpeaker || participantName;
        
        // 기존 타이머들 정리
        if (uiDisplayTimeoutRef.current) clearTimeout(uiDisplayTimeoutRef.current);
        if (apiSendTimeoutRef.current) clearTimeout(apiSendTimeoutRef.current);
        
        // API 전송만 수행 (UI 표시는 handleSpeechResult에서 처리)
        await handleSpeechResult(currentSpeaker, trimmedText);
        speakerQueue.push(currentSpeaker);
        if (speakerQueue.length > 3) speakerQueue.shift();
        lastProcessTime = Date.now();
        
        finalTranscript = '';
        setCurrentSpeech({ speaker: null, text: '' });
        isProcessing = false;
      }
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      lastSpeechTime = Date.now();
      
      // 기존 침묵 타이머 클리어
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          
          // 즉시 문장 끝 패턴 확인
          const fullText = finalTranscript.trim();
          if (koreanSentenceEnders.strong.test(fullText)) {
            // 강한 종결어: 0.3초 후 처리
            setTimeout(() => processSentence(finalTranscript), 300);
            return;
          } else if (koreanSentenceEnders.weak.test(fullText)) {
            // 약한 종결어: 0.5초 후 처리  
            setTimeout(() => processSentence(finalTranscript), 500);
            return;
          }
        } else {
          interimTranscript += transcript;
        }
      }

      // 실시간으로 현재 음성 텍스트 업데이트
      const fullText = finalTranscript + interimTranscript;
      if (fullText.trim()) {
        setCurrentSpeech({
          speaker: currentSpeaker,
          text: fullText.trim()
        });

        // 침묵 감지 타이머 설정
        const currentText = fullText.trim();
        let silenceDelay;
        
        if (koreanSentenceEnders.pause.test(currentText)) {
          // 중간 쉼 패턴: 0.8초
          silenceDelay = 800;
        } else if (currentText.length < 5) {
          // 짧은 발언: 0.6초 (예: "네", "아니")
          silenceDelay = 600;
        } else {
          // 일반 발언: 1초
          silenceDelay = 1000;
        }

        silenceTimer = setTimeout(() => {
          const silenceDuration = Date.now() - lastSpeechTime;
          if (silenceDuration >= silenceDelay && finalTranscript.trim()) {
            processSentence(finalTranscript);
          }
        }, silenceDelay);
      }
    };

    recognition.onerror = (event) => {
      console.error('음성 인식 오류:', event.error);
      console.error('오류 상세:', {
        error: event.error,
        message: event.message,
        timeStamp: event.timeStamp,
        type: event.type
      });
      
      if (event.error === 'no-speech') {
        console.log('음성이 감지되지 않았습니다.');
      } else if (event.error === 'audio-capture') {
        console.error('오디오 캡처 실패 - 마이크 접근 문제일 수 있습니다.');
      } else if (event.error === 'not-allowed') {
        console.error('마이크 권한이 거부되었습니다.');
      } else if (event.error === 'aborted') {
        console.error('음성 인식이 중단되었습니다.');
      } else if (event.error === 'network') {
        console.error('네트워크 오류 - 구글 음성 인식 서비스 연결 실패');
        console.log('5초 후 STT 재초기화 시도...');
        // 네트워크 오류 시 STT 완전 재초기화
        setTimeout(() => {
          if (sttEnabled) {
            console.log('STT 재초기화 시도');
            stopSTT();
            setTimeout(() => {
              startSTT();
            }, 1000);
          }
        }, 5000);
      }
    };

    recognition.onend = () => {
      console.log('음성 인식이 중단되었습니다.');
      console.log('STT 상태:', {
        sttEnabled,
        readyState: recognition.readyState,
        continuous: recognition.continuous,
        interimResults: recognition.interimResults
      });
      
      // recognitionRef.current가 존재하고 STT가 활성화된 상태에서만 재시작
      if (recognitionRef.current && sttEnabled) {
        console.log('1초 후 재시작 시도...');
        setTimeout(() => {
          try {
            // 재시작 전에 현재 STT 상태를 다시 확인
            if (recognitionRef.current && sttEnabled) {
              console.log('재시작 시도 전 상태:', {
                sttEnabled,
                readyState: recognition.readyState
              });
              recognition.start();
              console.log('음성 인식을 다시 시작합니다.');
            } else {
              console.log('재시작 조건이 맞지 않음 - STT 비활성화됨');
            }
          } catch (error) {
            console.error('음성 인식 재시작 실패:', error);
            console.error('에러 상세:', {
              name: error.name,
              message: error.message,
              code: error.code
            });
            
            // InvalidStateError가 발생한 경우 완전 재초기화
            if (error.name === 'InvalidStateError') {
              console.log('STT 완전 재초기화 시도...');
              setTimeout(() => {
                if (sttEnabled) {
                  stopSTT();
                  setTimeout(() => {
                    startSTT();
                  }, 500);
                }
              }, 1000);
            }
          }
        }, 1000);
      } else {
        console.log('STT가 비활성화되어 재시작하지 않습니다.');
      }
    };

    // WebRTC speaking 감지 이벤트 리스너
    const handleSpeakerChange = (event) => {
      const { speakerId, level } = event.detail;
      if (level > 0.1) {
        activeSpeaker = speakerId;
        console.log(`[Speaking 감지] 화자 변경: ${activeSpeaker}`);
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('speakerChanged', handleSpeakerChange);

    recognitionRef.current = recognition;
    return true;
  };

  // STT 시작
  const startSTT = () => {
    if (sttEnabled) {
      console.log('[STT] 이미 STT가 활성화되어 있습니다.');
      return;
    }

    if (!recognitionRef.current && !initSTT()) {
      return;
    }

    try {
      console.log('STT 시작 시도...', {
        continuous: recognitionRef.current.continuous,
        interimResults: recognitionRef.current.interimResults,
        lang: recognitionRef.current.lang
      });
      recognitionRef.current.start();
      setSttEnabled(true);
      console.log('음성 인식 시작 성공');
      
      // LiveKit Data Channel 초기화
      initLivekitDataChannel();
      
      // STT 재시작 시 참조 변수들 초기화
      lastSentTextRef.current = '';
      lastSentTimeRef.current = 0;
      processingRef.current = false;
    } catch (error) {
      console.error('음성 인식 시작 실패:', error);
      // 이미 시작된 상태라면 에러를 무시
      if (error.message && error.message.includes('already started')) {
        console.log('[STT] 이미 시작된 상태입니다.');
        setSttEnabled(true);
        // LiveKit Data Channel 초기화
        initLivekitDataChannel();
      }
    }
  };

  // STT 중지
  const stopSTT = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    if (coachingTimeoutRef.current) {
      clearTimeout(coachingTimeoutRef.current);
    }
    if (silenceCheckTimeoutRef.current) {
      clearTimeout(silenceCheckTimeoutRef.current);
    }
    if (uiDisplayTimeoutRef.current) {
      clearTimeout(uiDisplayTimeoutRef.current);
    }
    if (apiSendTimeoutRef.current) {
      clearTimeout(apiSendTimeoutRef.current);
    }
    
    // LiveKit Data Channel 연결 해제
    setLivekitConnected(false);

    // speaking 이벤트 리스너 제거
    const handleSpeakerChange = (event) => {
      const { speakerId, level } = event.detail;
      if (level > 0.1) {
        // activeSpeaker update logic would be here
      }
    };
    window.removeEventListener('speakerChanged', handleSpeakerChange);
    
    setSttEnabled(false);
    setAiMediationEnabled(false);
    setCoachingEnabled(false);
    setConversations([]);
    setCurrentSpeech({ speaker: null, text: '' });
    lastCoachingTimeRef.current = 0;
    lastSpeechTimeRef.current = Date.now();
    console.log('음성 인식 및 WebSocket 연결 중지');
  };

  // STT 토글
  const toggleSTT = () => {
    if (sttEnabled) {
      stopSTT();
    } else {
      startSTT();
    }
  };

  // AI 중재 토글 (코칭도 함께 활성화)
  const toggleAIMediation = () => {
    const newMediationState = !aiMediationEnabled;
    setAiMediationEnabled(newMediationState);
    
    // AI 중재 켜면 코칭도 함께 활성화
    if (newMediationState && !coachingEnabled) {
      const newCoachingState = true;
      setCoachingEnabled(newCoachingState);
      console.log('[코칭] AI 중재와 함께 활성화됨');
      
      // 코칭 활성화 시 침묵 모니터링 즉시 시작
      lastSpeechTimeRef.current = Date.now();
      startSilenceMonitoring();
    }
  };

  // AI 코칭 토글
  const toggleCoaching = () => {
    const newCoachingState = !coachingEnabled;
    setCoachingEnabled(newCoachingState);
    
    if (newCoachingState) {
      console.log('[코칭] 활성화됨');
      // 코칭 활성화 시 침묵 모니터링 즉시 시작 (대화 없어도 30초 후 트리거)
      lastSpeechTimeRef.current = Date.now(); // 현재 시간으로 설정
      startSilenceMonitoring();
      
      // 기존 대화가 있으면 첫 번째 체크도 실행
      if (conversationLogRef.current.length >= 2) {
        setTimeout(() => checkCoachingNeeded(), 2000); // 2초 후 첫 체크
      }
    } else {
      console.log('[코칭] 비활성화됨');
      if (coachingTimeoutRef.current) {
        clearTimeout(coachingTimeoutRef.current);
      }
      if (silenceCheckTimeoutRef.current) {
        clearTimeout(silenceCheckTimeoutRef.current);
      }
    }
  };

  return {
    // 상태
    sttEnabled,
    aiMediationEnabled,
    coachingEnabled,
    conversations,
    currentSpeech,
    livekitConnected,

    // 참조 (필요한 경우 외부에서 접근)
    recognitionRef,
    speechTimeoutRef,
    conversationLogRef,

    // 함수
    toggleSTT,
    toggleAIMediation,
    toggleCoaching,
    stopSTT,
    startSTT,
    handleSpeechResult,
    sendSTTToFastAPI,
    sendSTTToLiveKit,
    checkCoachingNeeded
  };
};