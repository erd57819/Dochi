import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { videoCallApi } from '../services/videoCallApi.js';
import hedgehogImg from '../assets/conflict.png';


const ConflictAnalysisResultPage = () => {
  const [conflictData, setConflictData] = useState(null);
  const [isLoading, setIsLoading]       = useState(true);
  
  // 분석 데이터 렌더링 헬퍼 함수 (최적화됨)
  const renderAnalysisData = (data) => {
    if (!data) return 'AI가 분석하고 있습니다...';
    if (typeof data === 'string') return data;
    
    // 문자열이 아닌 경우 직접 텍스트로 처리
    return String(data);
  };
  const { tempId } = useParams();
  const navigate = useNavigate();
  
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

  // 간단한 폴백 분석 (AI 백엔드 실패 시에만 사용)
  const generateSimpleFallback = (basicData) => {
    return {
      conflict_analysis: '의사소통 부족과 서로 다른 관점이 주요 원인으로 보입니다.',
      my_position: '갈등 해결을 위해 노력하고 있으며, 상대방과의 소통을 원하고 있습니다.',
      partner_position: '상대방도 나름의 입장과 이유가 있을 것으로 추정됩니다.',
      relationship_health_score: Math.max(30, 80 - (basicData.intensity * 5)),
      communication_score: Math.max(20, 70 - (basicData.intensity * 4)),
      trust_score: { score: Math.max(25, 65 - (basicData.intensity * 3)), analysis: '신뢰 회복이 필요합니다.' },
      cooperation_score: { score: Math.max(30, 70 - (basicData.intensity * 3)), improvement_suggestions: ['대화하기', '이해하기'] },
      priority_recommendation: basicData.intensity >= 7 ? 'HIGH' : 'MEDIUM',
      recommended_actions: ['대화 시간 갖기', '상호 이해하기']
    };
  };


  // 토닥토닥 서비스로 이동
  const handleComfort = () => {
    if (tempId) {
      sessionStorage.setItem('currentTempId', tempId);
      navigate(`/comfort?tempId=${tempId}`);
    } else {
      navigate('/comfort');
    }
  };


  // 전문 상담사 매칭 페이지로 이동
  const handleExpertMatching = () => {
    if (tempId) {
      sessionStorage.setItem('currentTempId', tempId);
      navigate(`/expert-matching?tempId=${tempId}`);
    } else {
      navigate('/expert-matching');
    }
  };

  // 다시 갈등 작성 페이지로 이동
  const handleNewConflict = () => {
    navigate('/conflicts/create');
  };
  
  // 로드맵 페이지로 이동
  const handleRoadmap = () => {
    if (tempId) {
      sessionStorage.setItem('currentTempId', tempId);
      navigate(`/roadmap?tempId=${tempId}`);
    } else {
      navigate('/roadmap');
    }
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
      // 2) 먼저 Redis에서 캐시된 분석 결과 조회
      const cachedRes = await fetch(
        `${API_BASE_URL}/conflict/analyze/cached/${tempId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (cachedRes.ok) {
        const cachedJson = await cachedRes.json();
        
        // 캐시된 결과가 있는 경우
        if (cachedJson.data && Object.keys(cachedJson.data).length > 0) {
          console.log('Redis에서 캐시된 분석 결과 발견:', cachedJson.data);
          
          // sessionStorage에 저장된 기본 AI 요약/해결방안 사용 (추가 API 호출 불필요)
          const basicAi = { 
            summary: basicData.aiSummary, 
            solutions: basicData.aiSolutions 
          };
          
          // 캐시된 데이터로 화면 구성
          const adv = cachedJson.data;
          
          console.log('✅ Redis 캐시 데이터 사용 - 빠른 로딩 완료');
          
          // 데이터 먼저 설정한 후 로딩 상태 해제
          setConflictData({
            ...basicData,
            aiSummary: basicAi.summary || '기본 요약',
            aiSolutions: basicAi.solutions || '기본 해결방안',
            conflictAnalysis: adv.conflict_analysis ?? adv.conflictAnalysis ?? '',
            myPosition: adv.my_position ?? adv.myPosition ?? '내 입장을 AI가 분석해서 정리해드립니다.',
            partnerPosition: adv.partner_position ?? adv.partnerPosition ?? '상대방의 입장을 AI가 추정해서 분석해드립니다.',
            relationshipHealthScore: adv.relationship_health_score ?? adv.relationshipHealthScore ?? 0,
            communicationScore: adv.communication_score ?? adv.communicationScore ?? 0,
            trustScore: adv.trust_score ?? adv.trustScore ?? { score: 0, analysis: '' },
            cooperationScore: adv.cooperation_score ?? adv.cooperationScore ?? { score: 0, improvement_suggestions: [] },
            priorityRecommendation: adv.priority_recommendation ?? adv.priorityRecommendation ?? '',
            recommendedActions: adv.recommended_actions ?? adv.recommendedActions ?? []
          });
          
          // 데이터 설정 후 로딩 상태 해제
          setIsLoading(false);
          return;
        }
      }

      // 3) 캐시된 결과가 없는 경우, 새로 분석 수행
      // 4) 기본 AI 요약/해결방안 호출
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

      // 5) 고급 AI 분석 호출
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
      
      // 6) 고급 분석 데이터 추출
      const conflictAnalysis        = adv.conflict_analysis        ?? adv.conflictAnalysis        ?? '';
      const myPosition              = adv.my_position              ?? adv.myPosition              ?? '';
      const partnerPosition         = adv.partner_position         ?? adv.partnerPosition         ?? '';
      const relationshipHealthScore = adv.relationship_health_score ?? adv.relationshipHealthScore ?? 0;
      const communicationScore      = adv.communication_score      ?? adv.communicationScore      ?? 0;
      const trustScoreRaw           = adv.trust_score              ?? adv.trustScore              ?? { score:0, analysis:'' };
      const cooperationScoreRaw     = adv.cooperation_score        ?? adv.cooperationScore        ?? { score:0, improvement_suggestions:[] };
      const priorityRecommendation  = adv.priority_recommendation  ?? adv.priorityRecommendation  ?? '';
      const recommendedActionsRaw   = adv.recommended_actions      ?? adv.recommendedActions      ?? [];
      
      // 디버그 로그 추가
      console.log('AI 분석 데이터 확인:');
      console.log('- conflictAnalysis:', conflictAnalysis);
      console.log('- myPosition:', myPosition);
      console.log('- partnerPosition:', partnerPosition);
      
      console.log('비어있는 값 확인:');
      console.log('- conflictAnalysis 비어있음?', isEmptyOrError(conflictAnalysis));
      console.log('- myPosition 비어있음?', isEmptyOrError(myPosition));
      console.log('- partnerPosition 비어있음?', isEmptyOrError(partnerPosition));
      
      // 핵심 분석(conflict)만 체크하고, position은 선택적으로 처리
      if (isEmptyOrError(conflictAnalysis)) {
        console.log('백엔드에서 핵심 분석 데이터 수신 실패 - 폴백 분석 사용');
        throw new Error('백엔드 AI 핵심 분석 결과가 비어있음');
      }

      // 7) JSON.parse 처리 (필요한 경우만)
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

      // 8) 상태 업데이트
      setConflictData({
        ...basicData,
        aiSummary:                basicAi.summary,
        aiSolutions:              basicAi.solutions,
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
      console.log('백엔드 AI 실패 - 간단한 폴백 분석 사용');

      // 간단한 폴백 분석 사용
      const fallbackAnalysis = generateSimpleFallback(basicData);
      
      setConflictData({
        ...basicData,
        aiSummary:                basicData.aiSummary,
        aiSolutions:              basicData.aiSolutions,
        conflictAnalysis:         fallbackAnalysis.conflict_analysis,
        myPosition:               fallbackAnalysis.my_position,
        partnerPosition:          fallbackAnalysis.partner_position,
        relationshipHealthScore:  fallbackAnalysis.relationship_health_score,
        communicationScore:       fallbackAnalysis.communication_score,
        trustScore:               fallbackAnalysis.trust_score,
        cooperationScore:         fallbackAnalysis.cooperation_score,
        priorityRecommendation:   fallbackAnalysis.priority_recommendation,
        recommendedActions:       fallbackAnalysis.recommended_actions
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConflict = async () => {
    setIsLoading(true);
    try {
      await saveConflict();
      alert('갈등 카드가 성공적으로 생성되었습니다! 🦔');
      navigate('/mypage');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };


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


            {/* 새로운 레이아웃: 이미지와 갈등분석 */}
            <div className="space-y-8">
              {/* 상단: 이미지와 갈등 분석 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* 이미지 영역 */}
                <div className="text-center">
                  <div 
                    className="w-60 h-60 mx-auto rounded-full flex items-center justify-center shadow-lg mb-6"
                    style={{ background: 'linear-gradient(135deg, #E8E8E8, #D0D0D0)' }}
                  >
                    <img 
                      src={hedgehogImg} 
                      alt="갈등도치" 
                      className="w-44 h-44 object-contain"
                    />
                  </div>
                  <h4 className="text-2xl font-bold" style={{ color: '#333333' }}>
                    {getConflictTypeText(conflictData?.conflictType || 'ETC')}
                  </h4>
                </div>

                {/* 갈등 분석 */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8">
                  <h4 className="text-xl font-bold text-purple-800 mb-6 flex items-center gap-3">
                    <span className="text-2xl">⚡</span> 갈등 분석
                  </h4>
                  <div 
                    className="text-purple-700"
                    style={{ lineHeight: '1.8' }}
                    dangerouslySetInnerHTML={{ __html: renderAnalysisData(conflictData?.conflictAnalysis) }}
                  />
                </div>
              </div>

              {/* 입장 정리 - 감정/갈등 분석 아래로 */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📝</span> 입장 정리
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="mb-3">
                      <span className="font-medium text-blue-700">내 입장 (AI 분석):</span>
                      <div 
                        className="mt-1 text-gray-700"
                        style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}
                        dangerouslySetInnerHTML={{ __html: renderAnalysisData(conflictData?.myPosition) }}
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div>
                      <span className="font-medium text-red-700">상대방 입장 (AI 추정):</span>
                      <div 
                        className="mt-1 text-gray-700"
                        style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}
                        dangerouslySetInnerHTML={{ __html: renderAnalysisData(conflictData?.partnerPosition) }}
                      />
                    </div>
                  </div>
                </div>
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
          {/* 하단 메시지 - 강조된 스타일 */}
          <div className="text-center mb-16 pt-12">
            <div className="relative inline-block">
              {/* 배경 어쿨트 */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-2xl transform rotate-1 opacity-70"></div>
              <div className="relative bg-white rounded-2xl p-8 border-2 border-orange-300 shadow-lg">
                <h2 className="text-4xl font-bold mb-2" style={{ 
                  background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  리포트를 기반으로
                </h2>
                <h2 className="text-5xl font-black" style={{ 
                  background: 'linear-gradient(45deg, #D2691E, #FF8C00)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                }}>
                  '맞춤 해결책' 제안해드릴게요!
                </h2>
                <div className="mt-4">
                  <span className="text-2xl">🎆</span>
                  <span className="ml-2 text-xl text-orange-600 font-medium">당신에게 최적화된 솔루션</span>
                  <span className="ml-2 text-2xl">🎆</span>
                </div>
              </div>
            </div>
          </div>

          {/* 서비스 카드들 */}
          <div className="mb-16">
            {/* 첫 번째 줄 - 2개 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* 화상채팅 카드 */}
              <div 
                className="text-white rounded-3xl p-10 relative overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:-translate-y-2"
                style={{ background: '#83673f' }}
                onClick={createVideoCallRoom}
              >
                <div className="absolute top-4 right-4">
                  <span className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                    추천
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-6">화상채팅 방 생성</h3>
                <p className="mb-8 leading-relaxed opacity-90">
                  상대방과 직접 화상으로 대화하고, AI 갈등 도우미 참견도치가 갈등 중재를 도와줘요
                </p>
                <div className="absolute bottom-8 right-8">
                  <span className="text-2xl">📹</span>
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
                onClick={handleShareConflict}
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
                <div className="absolute top-3 right-3">
                  <span className="bg-orange-400 text-white text-xs font-bold px-2 py-1 rounded-full">
                    추천
                  </span>
                </div>
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
