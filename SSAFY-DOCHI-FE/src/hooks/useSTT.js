import { useState, useRef } from 'react';
import apiClient from '../config/axios';

export const useSTT = (roomName, participantName) => {
  // STT 관련 상태
  const [sttEnabled, setSttEnabled] = useState(false);
  const [aiMediationEnabled, setAiMediationEnabled] = useState(false);
  const [coachingEnabled, setCoachingEnabled] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentSpeech, setCurrentSpeech] = useState({ speaker: null, text: '' });

  // STT 관련 참조
  const recognitionRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const conversationLogRef = useRef([]);
  const lastSentTextRef = useRef(''); // 마지막 전송된 텍스트 저장
  const coachingTimeoutRef = useRef(null);
  const lastCoachingTimeRef = useRef(0);
  const lastSpeechTimeRef = useRef(Date.now()); // 마지막 발언 시간
  const silenceCheckTimeoutRef = useRef(null); // 침묵 체크 타이머

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
    // 중복 전송 방지: 마지막에 전송한 텍스트와 동일하면 스킵
    if (lastSentTextRef.current === text.trim()) {
      console.log('[STT] 중복 텍스트 감지, 전송 스킵:', text.trim());
      return;
    }

    // 너무 짧은 텍스트는 무시 (노이즈 방지)
    if (text.trim().length < 2) {
      console.log('[STT] 텍스트가 너무 짧음, 전송 스킵:', text.trim());
      return;
    }

    lastSentTextRef.current = text.trim();
    
    const timestamp = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const newConversation = {
      id: Date.now(),
      speaker,
      text,
      timestamp,
      aiSuggestion: null
    };

    setConversations(prev => [...prev, newConversation]);
    conversationLogRef.current.push(newConversation);

    // 발언 시간 업데이트 (침묵 추적용)
    lastSpeechTimeRef.current = Date.now();
    
    // 기존 침묵 체크 타이머 초기화
    if (silenceCheckTimeoutRef.current) {
      clearTimeout(silenceCheckTimeoutRef.current);
    }
    
    // 새로운 침묵 체크 타이머 시작
    if (coachingEnabled) {
      startSilenceMonitoring();
    }

    // FastAPI로 STT 데이터 전송 (한 화자가 말이 끝났을 때)
    await sendSTTToFastAPI(speaker, text);

    // 코칭이 활성화된 경우 코칭 분석 수행
    if (coachingEnabled) {
      await checkCoachingNeeded();
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
    
    // 침묵 기반 코칭 체크 (대화 없이도 침묵만으로 체크)
    if (conversationLogRef.current.length >= 1) {
      await checkCoachingNeeded();
    }
    
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

    recognition.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
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

        // 말이 끝났다고 판단되면 처리 (3초간 새로운 음성이 없으면)
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
        }

        speechTimeoutRef.current = setTimeout(async () => {
          if (finalTranscript.trim() && !isProcessing) {
            isProcessing = true;
            await handleSpeechResult(currentSpeaker, finalTranscript.trim());
            finalTranscript = '';
            setCurrentSpeech({ speaker: null, text: '' });
            isProcessing = false;
          }
        }, 3000);
      }
    };

    recognition.onerror = (event) => {
      console.error('음성 인식 오류:', event.error);
      if (event.error === 'no-speech') {
        console.log('음성이 감지되지 않았습니다.');
      }
    };

    recognition.onend = () => {
      console.log('음성 인식이 중단되었습니다.');
      if (sttEnabled) {
        setTimeout(() => {
          try {
            recognition.start();
            console.log('음성 인식을 다시 시작합니다.');
          } catch (error) {
            console.error('음성 인식 재시작 실패:', error);
          }
        }, 1000);
      }
    };

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
      recognitionRef.current.start();
      setSttEnabled(true);
      console.log('음성 인식 시작');
      // STT 재시작 시 마지막 전송 텍스트 초기화
      lastSentTextRef.current = '';
    } catch (error) {
      console.error('음성 인식 시작 실패:', error);
      // 이미 시작된 상태라면 에러를 무시
      if (error.message && error.message.includes('already started')) {
        console.log('[STT] 이미 시작된 상태입니다.');
        setSttEnabled(true);
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
    setSttEnabled(false);
    setAiMediationEnabled(false);
    setCoachingEnabled(false);
    setConversations([]);
    setCurrentSpeech({ speaker: null, text: '' });
    lastCoachingTimeRef.current = 0;
    lastSpeechTimeRef.current = Date.now();
    console.log('음성 인식 중지');
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
  };

  // AI 코칭 토글
  const toggleCoaching = () => {
    const newCoachingState = !coachingEnabled;
    setCoachingEnabled(newCoachingState);
    
    if (newCoachingState) {
      console.log('[코칭] 활성화됨');
      // 코칭 활성화 시 첫 번째 체크 실행
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
    checkCoachingNeeded
  };
};