import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import useAuthStore from '../stores/AuthStore';
import { videoCallApi } from '../services/videoCallApi.js';
import hedgehogImg from '../assets/conflict.png';

const ConflictAnalysisResultPage = () => {
  const [conflictData, setConflictData] = useState(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [activeTab, setActiveTab]       = useState('tab1');
  const { tempId }                      = useParams();
  const navigate                        = useNavigate();
  const { token }                       = useAuthStore();
  
  // isEmptyOrError 헬퍼 함수 정의
  const isEmptyOrError = (value) => {
    if (!value) return true;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return value.trim() === '' || 
             lower.includes('분석 불가') || 
             lower.includes('완료할 수 없') ||
             lower.includes('error');
    }
    return false;
  };

  // 백엔드에서 AI 분석이 실패했을 때의 개선된 폴백 처리
  const generateImprovedFallback = (basicData) => {
    console.log('백엔드 AI 분석 실패 - 개선된 폴백 분석 생성:', basicData);
    
    const intensityText = basicData.intensity >= 8 ? '매우 강한' : 
                         basicData.intensity >= 6 ? '강한' : 
                         basicData.intensity >= 4 ? '보통' : '약한';
                         
    const typeMap = {
      WORK: '직장/업무',
      FAMILY: '가족',
      FRIEND: '친구',
      COUPLE: '연인/부부',
      NEIGHBOR: '이웃',
      FINANCIAL: '금전',
      ONLINE: '온라인',
      ETC: '기타'
    };
    
    const typeText = typeMap[basicData.conflictType] || '일반적인';
    
    // 갈등 내용 키워드 분석
    const description = basicData.description.toLowerCase();
    let emotionAnalysis = '';
    let conflictAnalysis = '';
    let myPosition = '';
    let partnerPosition = '';
    
    // 감정 분석 생성
    if (description.includes('동문서답') || description.includes('대화')) {
      emotionAnalysis = `소통의 어려움으로 인한 ${intensityText} 좌절감과 답답함을 경험하고 있습니다. 대화가 원활하지 않아 감정적 거리감이 커지고 있는 상태입니다.`;
    } else if (description.includes('화') || description.includes('분노')) {
      emotionAnalysis = `현재 ${intensityText} 분노와 억울함을 느끼고 있으며, 감정 조절이 어려운 상황입니다. 갈등 강도 ${basicData.intensity}/10으로 즉각적인 해결이 필요합니다.`;
    } else {
      emotionAnalysis = `갈등 강도 ${basicData.intensity}/10의 ${intensityText} 감정적 상태를 경험하고 있습니다. 상황 해결을 위한 체계적인 접근이 필요합니다.`;
    }
    
    // 갈등 분석 생성  
    if (description.includes('동문서답') || description.includes('대화')) {
      conflictAnalysis = `${typeText} 관계에서 서로 다른 소통 방식과 의사전달 패턴의 차이가 주요 원인입니다. 한쪽은 직접적인 소통을 원하지만 다른 쪽은 다른 방식으로 반응하여 의사소통 단절이 발생했습니다.`;
    } else {
      conflictAnalysis = `${typeText} 갈등으로, 근본적인 소통과 이해 부족이 주요 원인으로 보입니다. 서로의 관점과 필요를 이해하는 과정이 필요합니다.`;
    }
    
    // 입장 분석 생성
    if (basicData.conflictType === 'COUPLE' && description.includes('대화')) {
      myPosition = '대화할 때 소통이 잘 안되는 상황에서 상대방이 동문서답을 한다고 느끼고 있으며, 의미 있는 대화를 하고 싶어합니다.';
      partnerPosition = '상대방도 대화를 하려고 노력하고 있지만, 어떻게 대답해야 할지 모르거나 서로 다른 소통 방식을 선호할 가능성이 있습니다.';
    } else {
      myPosition = '갈등 상황에서 자신의 관점과 필요를 명확히 표현하고 해결을 원하고 있습니다.';
      partnerPosition = '상대방도 나름의 이유와 관점을 가지고 있으며, 상황에 대한 다른 해석을 할 수 있습니다.';
    }
    
    return {
      emotion_analysis: emotionAnalysis,
      conflict_analysis: conflictAnalysis,
      my_position: myPosition,
      partner_position: partnerPosition,
      relationship_health_score: Math.max(20, 100 - (basicData.intensity * 8)),
      communication_score: Math.max(10, 80 - (basicData.intensity * 6)),
      trust_score: { score: Math.max(15, 70 - (basicData.intensity * 7)), analysis: '신뢰 회복을 위한 노력이 필요합니다.' },
      cooperation_score: { score: Math.max(20, 75 - (basicData.intensity * 5)), improvement_suggestions: ['열린 대화', '상호 이해', '공통 목표 설정'] },
      priority_recommendation: basicData.intensity >= 7 ? 'HIGH' : basicData.intensity >= 4 ? 'MEDIUM' : 'LOW',
      recommended_actions: ['진정한 대화 시간 갖기', '상대방 입장 이해하기', '구체적인 해결방안 모색']
    };
  };

  const handleConflictResolution = () => {
    navigate('/video-call');
  };

  // 토닥토닥 서비스로 이동
  const handleComfort = () => {
    navigate('/comfort');
  };

  // 커뮤니티 페이지로 이동
  const handleCommunity = () => {
    navigate('/community');
  };

  // 전문 상담사 매칭 페이지로 이동
  const handleExpertMatching = () => {
    navigate('/expert-matching');
  };

  // 다시 갈등 작성 페이지로 이동
  const handleNewConflict = () => {
    navigate('/conflicts/create');
  };
  
  // 로드맵 페이지로 이동
  const handleRoadmap = () => {
    navigate('/roadmap');
  };
  
  useEffect(() => {
    if (tempId) fetchTempConflictData();
  }, [tempId]);

  const fetchTempConflictData = async () => {
    setIsLoading(true);

    // 1) sessionStorage에서 입력 데이터 가져오기
    const basicData = {
      title:           sessionStorage.getItem('tempTitle')           || '갈등 제목',
      description:     sessionStorage.getItem('tempDescription')     || '갈등 설명',
      conflictType:    sessionStorage.getItem('tempConflictType')    || 'ETC',
      aiSummary:       sessionStorage.getItem('tempAiSummary')       || '',
      aiSolutions:     sessionStorage.getItem('tempAiSolutions')     || '',
      createdAt:       new Date().toISOString(),
      intensity:       parseInt(sessionStorage.getItem('tempIntensity')) || 5,
      initialEmotion:  sessionStorage.getItem('tempEmotion')         || 'ANGER',
      priority:        sessionStorage.getItem('tempPriority')        || 'NONE',
      talkWillingness: sessionStorage.getItem('tempTalkWillingness') || 'YES',
      desiredOutcome:  sessionStorage.getItem('tempDesiredOutcome')  || 'RELATIONSHIP'
    };

    try {
      // 2) 기본 AI 요약/해결방안 호출
      const basicRes = await fetch(
        `${API_BASE_URL}/conflict/analyze/${tempId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type':  'application/json'
          }
        }
      );
      if (!basicRes.ok) throw new Error('기본 AI 분석 실패');
      const basicJson = await basicRes.json();
      const basicAi   = basicJson.data; // { summary, solutions }

      // 3) 고급 AI 분석 호출
      const advRes = await fetch(
        `${API_BASE_URL}/conflict/analyze/advanced/${tempId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type':  'application/json'
          }
        }
      );
      if (!advRes.ok) throw new Error('고급 AI 분석 실패');
      const advJson = await advRes.json();
      
      console.log('고급 분석 응답 전체:', JSON.stringify(advJson, null, 2));
      
      const adv = advJson.data;
      
      // 4) 고급 분석 데이터 추출
      const emotionAnalysis         = adv.emotion_analysis         ?? adv.emotionAnalysis         ?? '';
      const conflictAnalysis        = adv.conflict_analysis        ?? adv.conflictAnalysis        ?? '';
      const myPosition              = adv.my_position              ?? adv.myPosition              ?? '';
      const partnerPosition         = adv.partner_position         ?? adv.partnerPosition         ?? '';
      const relationshipHealthScore = adv.relationship_health_score ?? adv.relationshipHealthScore ?? 0;
      const communicationScore      = adv.communication_score      ?? adv.communicationScore      ?? 0;
      const trustScoreRaw           = adv.trust_score              ?? adv.trustScore              ?? { score:0, analysis:'' };
      const cooperationScoreRaw     = adv.cooperation_score        ?? adv.cooperationScore        ?? { score:0, improvement_suggestions:[] };
      const priorityRecommendation  = adv.priority_recommendation  ?? adv.priorityRecommendation  ?? '';
      const recommendedActionsRaw   = adv.recommended_actions      ?? adv.recommendedActions      ?? [];
      
      console.log('비어있는 값 확인:');
      console.log('- emotionAnalysis 비어있음?', isEmptyOrError(emotionAnalysis));
      console.log('- conflictAnalysis 비어있음?', isEmptyOrError(conflictAnalysis));
      console.log('- myPosition 비어있음?', isEmptyOrError(myPosition));
      console.log('- partnerPosition 비어있음?', isEmptyOrError(partnerPosition));
      
      // 핵심 분석(emotion, conflict)만 체크하고, position은 선택적으로 처리
      if (isEmptyOrError(emotionAnalysis) || isEmptyOrError(conflictAnalysis)) {
        console.log('백엔드에서 핵심 분석 데이터 수신 실패 - 폴백 분석 사용');
        throw new Error('백엔드 AI 핵심 분석 결과가 비어있음');
      }

      // 5) JSON.parse 처리 (필요한 경우만)
      const trustScore = typeof trustScoreRaw === 'string'
        ? JSON.parse(trustScoreRaw)
        : trustScoreRaw;
      const cooperationScore = typeof cooperationScoreRaw === 'string'
        ? JSON.parse(cooperationScoreRaw)
        : cooperationScoreRaw;
      const recommendedActions = Array.isArray(recommendedActionsRaw)
        ? recommendedActionsRaw
        : typeof recommendedActionsRaw === 'string'
        ? JSON.parse(recommendedActionsRaw)
        : [];

      // 6) 상태 업데이트
      setConflictData({
        ...basicData,
        aiSummary:                basicAi.summary,
        aiSolutions:              basicAi.solutions,
        emotionAnalysis:          emotionAnalysis,
        conflictAnalysis:         conflictAnalysis,
        myPosition:               myPosition || '내 입장을 AI가 분석해서 정리해드립니다.',
        partnerPosition:          partnerPosition || '상대방의 입장을 AI가 추정해서 분석해드립니다.',
        relationshipHealthScore:  relationshipHealthScore,
        communicationScore:       communicationScore,
        trustScore:               trustScore,
        cooperationScore:         cooperationScore,
        priorityRecommendation:   priorityRecommendation,
        recommendedActions:       recommendedActions
      });
    } catch (err) {
      console.error('AI 백엔드 연결 오류:', err);
      console.log('백엔드 AI 실패 - 개선된 폴백 분석 사용');

      // 개선된 폴백 분석 사용
      const improvedAnalysis = generateImprovedFallback(basicData);
      
      setConflictData({
        ...basicData,
        aiSummary:                basicData.aiSummary,
        aiSolutions:              basicData.aiSolutions,
        emotionAnalysis:          improvedAnalysis.emotion_analysis,
        conflictAnalysis:         improvedAnalysis.conflict_analysis,
        myPosition:               improvedAnalysis.my_position,
        partnerPosition:          improvedAnalysis.partner_position,
        relationshipHealthScore:  improvedAnalysis.relationship_health_score,
        communicationScore:       improvedAnalysis.communication_score,
        trustScore:               improvedAnalysis.trust_score,
        cooperationScore:         improvedAnalysis.cooperation_score,
        priorityRecommendation:   improvedAnalysis.priority_recommendation,
        recommendedActions:       improvedAnalysis.recommended_actions
      });
      
      console.log('개선된 폴백 분석 완료!');
      console.log('감정 분석:', improvedAnalysis.emotion_analysis);
      console.log('갈등 분석:', improvedAnalysis.conflict_analysis);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConflict = async () => {
    setIsLoading(true);
    try {
      await saveConflict();
      alert('갈등 카드가 성공적으로 생성되었습니다! 🦔');
      navigate('/conflicts');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => navigate('/conflicts');

  // ConflictDetailPage에서 사용하는 타입 변환 함수들
  const getConflictTypeText = (type) => {
    const types = {
      WORK: '직장 갈등',
      FAMILY: '가족 갈등',
      FRIEND: '친구 갈등',
      COUPLE: '연인/부부 갈등',
      NEIGHBOR: '이웃 갈등',
      FINANCIAL: '금전 갈등',
      ONLINE: '온라인 갈등',
      ETC: '기타 갈등'
    };
    return types[type] || '기타 갈등';
  };

  const getPriorityText = (priority) => {
    const texts = {
      RELATIONSHIP: '관계 유지',
      SOLUTION: '문제 해결',
      SELF_CARE: '자기 보호',
      PREVENTION: '재발 방지',
      NONE: '선택 안함'
    };
    return texts[priority] || '선택 안함';
  };

  const getEmotionText = (emotion) => {
    const emotions = {
      ANGER: '분노',
      SADNESS: '슬픈', 
      FRUSTRATION: '좌절',
      ETC: '기타'
    };
    return emotions[emotion] || '기타';
  };

  const getTalkWillingnessText = (willingness) => {
    const texts = {
      YES: '대화하고 싶음',
      MAYBE: '상황에 따라',
      NO: '대화하기 어려움',
      NONE: '선택 안함'
    };
    return texts[willingness] || '선택 안함';
  };

  // 갈등 저장 함수
  const saveConflict = async () => {
    try {
      // 1. 먼저 tempId로 저장 시도
      if (tempId) {
        const response = await fetch(`${API_BASE_URL}/conflict/analyze/advanced/save/${tempId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        if (response.ok) {
          return await response.json();
        }
      }

      // 2. tempId가 없거나 실패한 경우, 기본 갈등 생성 API 사용
      const conflictCreateData = {
        title: sessionStorage.getItem('tempTitle') || '갈등 제목',
        description: sessionStorage.getItem('tempDescription') || '갈등 설명',
        conflictType: sessionStorage.getItem('tempConflictType') || 'ETC',
        conflictWhen: parseInt(sessionStorage.getItem('tempConflictWhen')) || 7,
        conflictFrequency: parseInt(sessionStorage.getItem('tempConflictFrequency')) || 3,
        participants: sessionStorage.getItem('tempParticipants') || null,
        intensity: parseInt(sessionStorage.getItem('tempIntensity')) || 7,
        initialEmotion: sessionStorage.getItem('tempEmotion') || 'FRUSTRATION',
        priority: sessionStorage.getItem('tempPriority') || 'SOLUTION',
        talkWillingness: sessionStorage.getItem('tempTalkWillingness') || 'MAYBE',
        desiredOutcome: sessionStorage.getItem('tempDesiredOutcome') || 'RELATIONSHIP',
        aiSummary: sessionStorage.getItem('tempAiSummary') || '분석 결과'
      };

      const response = await fetch(`${API_BASE_URL}/conflict/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(conflictCreateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '갈등 카드 생성에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('갈등 저장 오류:', error);
      throw error;
    }
  };

  // 화상채팅 방 생성 (ConflictDetailPage와 동일한 로직)
  const createVideoCallRoom = async () => {
    try {
      setIsLoading(true);
      
      // 1. 먼저 갈등을 저장하여 conflictId 획득
      const conflictData = await saveConflict();
      
      if (!conflictData || !conflictData.data || !conflictData.data.id) {
        throw new Error('갈등 저장에 실패했습니다.');
      }
      
      const conflictId = conflictData.data.id;
      
      // 2. 저장된 conflictId로 화상채팅 방 생성 (ConflictDetailPage와 동일)
      const response = await videoCallApi.createRoom(conflictId);
      console.log('화상채팅 방 생성 응답:', response);
      
      // API 응답 구조에 맞게 데이터 추출
      const roomData = response.data || response;
      
      if (roomData && roomData.roomCode) {
        // 화상채팅 링크 생성
        const videoCallLink = `${window.location.origin}/video-call/${roomData.roomCode}`;
        
        // 링크를 클립보드에 복사 (HTTP/HTTPS 환경 모두 지원)
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(videoCallLink);
          } else {
            // HTTP 환경에서 fallback 방법
            const textArea = document.createElement('textarea');
            textArea.value = videoCallLink;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
          }
        } catch (clipboardError) {
          console.log('클립보드 복사 실패:', clipboardError);
        }
        
        alert(`화상채팅 방이 생성되었습니다!\n\n방 코드: ${roomData.roomCode}\n링크: ${videoCallLink}\n\n링크가 클립보드에 복사되었습니다.\n상대방에게 공유하여 함께 참여하세요!`);
        
        // 화상채팅 페이지로 이동
        navigate(`/video-call/${roomData.roomCode}`);
      } else {
        console.error('roomCode가 없습니다:', roomData);
        throw new Error('방 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('화상채팅 방 생성 오류:', error);
      alert('화상채팅 방 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 갈등 공유하기 함수 (ConflictDetailPage에서 가져온 함수)
  const handleShareConflict = () => {
    if (!conflictData) return;

    const conflictTypeText = getConflictTypeText(conflictData.conflictType);
    
    // 자동 생성된 제목
    const autoTitle = `[${conflictTypeText}] 갈등 상황 공유 - 조언 구합니다`;
    
    // 자동 생성된 내용 (찬반 투표 형식)
    const autoContent = `안녕하세요! 갈등 상황을 공유하며 여러분의 의견을 듣고 싶습니다.

📌 상황: ${conflictData.description}
💢 갈등 강도: ${conflictData.intensity}/10
🎯 목표: ${conflictData.desiredOutcome || '해결 방안을 찾고 싶어요'}

📊 **여러분의 의견을 들려주세요:**

**A안) 적극적 해결 방식**
- 직접 대화를 통해 문제를 해결
- 감정을 솔직하게 표현하고 소통
- 빠른 해결을 위한 적극적 접근

**B안) 신중한 접근 방식**  
- 시간을 두고 상황을 정리한 후 접근
- 중재자나 제3자의 도움 요청
- 관계 손상을 최소화하는 방향으로 진행

어떤 방식이 더 좋을지 댓글로 의견 부탁드립니다! 🙏

#갈등해결 #조언구함 #${conflictTypeText}`;

    // CreatePostPage로 이동하면서 데이터 전달
    navigate('/community/create', {
      state: {
        prefilledData: {
          title: autoTitle,
          content: autoContent,
          category: 'CONFLICT_SHARING'
        }
      }
    });
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* 상단 배경 영역 */}
      <div className="w-full relative">
        {/* 배경 오버레이 */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundColor: '#F8D6B3',
            opacity: 0.14,
            zIndex: 1
          }}
        ></div>
        
        {/* 메인 컨텐츠 - 상단 부분 */}
        <main className="max-w-5xl mx-auto px-4 py-12 relative z-10">
          {/* 상단 메시지 */}
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold mb-4" style={{ 
              background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              입력해주신 결과를 기반으로 리포트가 나왔어요
            </h2>
          </div>

          {/* 갈등 분석 카드 */}
          <div className="p-12 mb-12">
            <h3 className="text-3xl font-bold text-center mb-12" style={{ color: '#333333' }}>
              {conflictData?.title || '갈등 제목'}
            </h3>

            <div className="flex items-start gap-20">
              {/* 고슴도치 이미지 */}
              <div className="flex-shrink-0">
                <div 
                  className="w-60 h-60 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #E8E8E8, #D0D0D0)' }}
                >
                  <img 
                    src={hedgehogImg} 
                    alt="갈등도치" 
                    className="w-44 h-44 object-contain"
                  />
                </div>
                {/* 갈등 유형 소제목 */}
                <div className="text-center mt-6">
                  <h4 className="text-2xl font-bold" style={{ color: '#333333' }}>
                    {getConflictTypeText(conflictData?.conflictType || 'ETC')}
                  </h4>
                </div>
              </div>

              {/* 분석 내용 - 감정 분석, 갈등 분석, 입장 정리 */}
              <div className="flex-1 space-y-6">
                {/* 감정 분석 */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <span>😊</span> 감정 분석
                  </h4>
                  <p className="text-blue-700">
                    {conflictData?.emotionAnalysis || 'AI가 감정을 분석하고 있습니다...'}
                  </p>
                </div>

                {/* 갈등 분석 */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <span>⚡</span> 갈등 분석
                  </h4>
                  <p className="text-purple-700">
                    {conflictData?.conflictAnalysis || 'AI가 갈등 원인을 분석하고 있습니다...'}
                  </p>
                </div>


                {/* 입장 정리 */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span>📝</span> 입장 정리
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="mb-3">
                        <span className="font-medium text-blue-700">내 입장 (AI 분석):</span>
                        <p className="ml-2 mt-1 text-gray-700">
                          {conflictData?.myPosition || '내 입장을 AI가 분석해서 정리해드립니다.'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div>
                        <span className="font-medium text-red-700">상대방 입장 (AI 추정):</span>
                        <p className="ml-2 mt-1 text-gray-700">
                          {conflictData?.partnerPosition || '상대방의 입장을 AI가 추정해서 분석해드립니다.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI 우선순위 추천 */}
                {conflictData?.priorityRecommendation && (
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                      <span>⭐</span> AI 우선순위 추천
                    </h4>
                    <p className="text-yellow-700 font-medium">{conflictData.priorityRecommendation}</p>
                  </div>
                )}

                {/* AI 추천 행동 */}
                {conflictData?.recommendedActions && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span>💡</span> AI 추천 행동
                    </h4>
                    <ul className="space-y-2">
                      {(Array.isArray(conflictData.recommendedActions) 
                        ? conflictData.recommendedActions 
                        : typeof conflictData.recommendedActions === 'string' 
                        ? JSON.parse(conflictData.recommendedActions) 
                        : []
                      ).map((action, index) => (
                        <li key={index} className="flex items-start gap-3 text-gray-700">
                          <span className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 하단 배경 영역 (흰색) */}
      <div className="w-full relative">
        {/* 배경 오버레이 */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundColor: '#FFFFFF',
            zIndex: 1
          }}
        ></div>
        
        <main className="max-w-5xl mx-auto px-4 relative z-10">
          {/* 하단 메시지 */}
          <div className="text-center mb-16 pt-12">
            <h2 className="text-4xl font-bold" style={{ 
              background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              리포트를 기반으로 '맞춤 해결책'을 제안해드릴게요
            </h2>
          </div>

          {/* 서비스 카드들 */}
          <div className="mb-16">
            {/* 첫 번째 줄 - 2개 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* 갈등해결하기 카드 */}
              <div 
                className="text-white rounded-3xl p-10 relative overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:-translate-y-2"
                style={{ background: '#83673f' }}
                onClick={handleConflictResolution}
              >
                <h3 className="text-2xl font-bold mb-6">갈등해결하기</h3>
                <p className="mb-8 leading-relaxed opacity-90">
                  화상 대화 속 감정과 대화를 읽고, AI 갈등 도우미 참견도치가 갈등 중재를 도와줘요
                </p>
                <div className="absolute bottom-8 right-8">
                  <span className="text-2xl">→</span>
                </div>
              </div>

              {/* 토닥토닥 서비스 카드 */}
              <div 
                className="text-white rounded-3xl p-10 relative overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:-translate-y-2"
                style={{ background: '#7F5539' }}
                onClick={handleComfort}
              >
                <h3 className="text-2xl font-bold mb-6">토닥토닥 서비스</h3>
                <p className="mb-8 leading-relaxed opacity-90">
                  참견도치 챗봇이 고민을 들어주고, 당신의 이야기를 따뜻하게 정리해줘요
                </p>
                <div className="absolute bottom-8 right-8">
                  <span className="text-2xl">→</span>
                </div>
              </div>
            </div>

            {/* 두 번째 줄 - 3개 작은 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 갈등 커뮤니티 카드 */}
              <div 
                className="text-white rounded-3xl p-8 relative overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:-translate-y-2"
                style={{ background: '#CD9F6E' }}
                onClick={handleCommunity}
              >
                <h3 className="text-xl font-bold mb-4">갈등 커뮤니티</h3>
                <p className="mb-6 leading-relaxed opacity-90 text-sm">
                  비슷한 고민을 가진 사람들과 이야기해보세요<br/>
                </p>
                <div className="absolute bottom-6 right-6">
                  <span className="text-xl">→</span>
                </div>
              </div>

              {/* 5단계 해결 로드맵 카드 */}
              <div 
                className="rounded-3xl p-8 relative overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:-translate-y-2"
                style={{ background: '#f8d6b3', color: '#3d2b1f' }}
                onClick={handleRoadmap}
              >
                <h3 className="text-xl font-bold mb-4">5단계 로드맵</h3>
                <p className="mb-6 leading-relaxed opacity-90 text-sm">
                  체계적인 갈등 해결을 위한 단계별 가이드를 확인하세요
                </p>
                <div className="absolute bottom-6 right-6">
                  <span className="text-xl">→</span>
                </div>
              </div>

              {/* 전문상담사 매칭 카드 */}
              <div 
                className="text-white rounded-3xl p-8 relative overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:-translate-y-2"
                style={{ background: '#EE9278' }}
                onClick={handleExpertMatching}
              >
                <h3 className="text-xl font-bold mb-4">전문상담사 매칭</h3>
                <p className="mb-6 leading-relaxed opacity-90 text-sm">
                  더 깊은 상담이 필요하다면 전문 상담사와 매칭해보세요
                </p>
                <div className="absolute bottom-6 right-6">
                  <span className="text-xl">→</span>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 버튼들 */}
          <div className="flex justify-between gap-6 pb-12">
            <button
              onClick={handleNewConflict}
              className="px-4 py-4 rounded-2xl hover:opacity-70 transition-all font-medium"
              style={{ color: '#666666', background: 'transparent' }}
            >
              다시 작성하기
            </button>
            <button
              onClick={handleSaveConflict}
              className="px-8 py-4 text-white rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 font-medium"
              style={{ background: '#BF7D2C' }}
              disabled={isLoading}
            >
              {isLoading ? '저장 중...' : '갈등 카드 저장하기'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ConflictAnalysisResultPage;
