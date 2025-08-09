import { useState, useRef } from 'react';
import apiClient from '../config/axios';

export const useSTT = (roomName, participantName) => {
  // STT 관련 상태
  const [sttEnabled, setSttEnabled] = useState(false);
  const [aiMediationEnabled, setAiMediationEnabled] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentSpeech, setCurrentSpeech] = useState({ speaker: null, text: '' });

  // STT 관련 참조
  const recognitionRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const conversationLogRef = useRef([]);

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
      
      // FastAPI로 STT 데이터 전송
      await apiClient.post('/ai/speech/process-conflict-chunk', payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[STT] FastAPI 전송 성공');
    } catch (error) {
      console.error('[STT] FastAPI 전송 실패:', error);
    }
  };

  // 음성 인식 결과 처리
  const handleSpeechResult = async (speaker, text) => {
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

    // FastAPI로 STT 데이터 전송 (한 화자가 말이 끝났을 때)
    await sendSTTToFastAPI(speaker, text);

    // 갈등 감지 및 중재 타이밍 결정
    const shouldMediate = await analyzeConflictAndTiming(text, speaker);
    
    if (shouldMediate && aiMediationEnabled) {
      try {
        const suggestion = await getAISuggestion(text, speaker);
        
        setConversations(prev => 
          prev.map(conv => 
            conv.id === newConversation.id 
              ? { ...conv, aiSuggestion: suggestion }
              : conv
          )
        );
      } catch (error) {
        console.error('AI 중재 요청 실패:', error);
      }
    }
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
    if (!recognitionRef.current && !initSTT()) {
      return;
    }

    try {
      recognitionRef.current.start();
      setSttEnabled(true);
      console.log('음성 인식 시작');
    } catch (error) {
      console.error('음성 인식 시작 실패:', error);
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
    setSttEnabled(false);
    setAiMediationEnabled(false);
    setConversations([]);
    setCurrentSpeech({ speaker: null, text: '' });
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

  return {
    // 상태
    sttEnabled,
    aiMediationEnabled,
    conversations,
    currentSpeech,

    // 참조 (필요한 경우 외부에서 접근)
    recognitionRef,
    speechTimeoutRef,
    conversationLogRef,

    // 함수
    toggleSTT,
    toggleAIMediation,
    stopSTT,
    startSTT,
    handleSpeechResult,
    sendSTTToFastAPI
  };
};