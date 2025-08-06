import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import useAuthStore from '../stores/AuthStore';
import { videoCallApi } from '../services/videoCallApi.js';
import hedgehogImg from '../assets/conflict.png';

const ConflictAnalysisResultPage = () => {
  const [conflictData, setConflictData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { tempId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  useEffect(() => {
    if (tempId) {
      fetchTempConflictData();
    }
  }, [tempId]);

  // AI 분석 함수들 - 실제 받은 데이터를 기반으로 분석
  const generateAIAnalysis = (conflictData) => {
    if (!conflictData) return {};

    const { 
      title, 
      description, 
      conflictType, 
      intensity, 
      initialEmotion, 
      priority, 
      talkWillingness, 
      desiredOutcome 
    } = conflictData;

    // 감정 분석
    const analyzeEmotion = () => {
      const emotionMap = {
        ANGER: '분노와 격한 감정',
        SADNESS: '슬픔과 실망감',
        FRUSTRATION: '좌절감과 답답함',
        ETC: '복합적인 감정'
      };
      
      const currentEmotion = emotionMap[initialEmotion] || '알 수 없는 감정';
      const intensityText = intensity >= 8 ? '매우 강한' : intensity >= 6 ? '강한' : intensity >= 4 ? '보통' : '약한';
      
      // 갈등 내용에 따른 감정 분석 개선
      let specificEmotion = '';
      if (description.includes('사기') || description.includes('속았')) {
        specificEmotion = '배신감과 분노, 그리고 믿었던 사람에 대한 실망감이';
      } else if (description.includes('무시') || description.includes('차별')) {
        specificEmotion = '무력감과 억울함이';
      } else if (description.includes('돈') || description.includes('비용') || description.includes('경제')) {
        specificEmotion = '경제적 부담감과 불공평함에 대한 분노가';
      } else {
        specificEmotion = `${currentEmotion}이`;
      }
      
      return `현재 ${specificEmotion} ${intensityText} 갈등 강도(${intensity}/10)로 나타나고 있습니다. ${intensity >= 7 ? '즉각적인 해결이 필요한 상황입니다.' : '시간을 두고 차근차근 접근할 수 있는 상황입니다.'}`;
    };

    // 갈등 원인 분석
    const analyzeConflict = () => {
      // 갈등 내용에 따른 구체적 분석
      let specificAnalysis = '';
      
      if (description.includes('사기') || description.includes('속았')) {
        if (description.includes('메이플') || description.includes('게임')) {
          specificAnalysis = '온라인 게임 내에서의 사기 행위로 인한 신뢰 파괴가 주요 원인입니다. 특히 알던 사람에게 당한 사기는 더욱 큰 배신감을 낳니다';
        } else {
          specificAnalysis = '사기 행위로 인한 신뢰 관계의 파괴가 주요 원인입니다';
        }
      } else {
        const typeAnalysis = {
          WORK: '업무 환경에서의 의견 차이와 역할 갈등',
          FAMILY: '가족 구성원 간의 가치관 차이와 기대 불일치',
          FRIEND: '친구 관계에서의 오해와 소통 부족',
          COUPLE: '연인/부부 간의 감정적 거리감과 생활 패턴 차이',
          NEIGHBOR: '생활 반경 내에서의 이해관계 충돌',
          FINANCIAL: '금전적 가치관과 우선순위의 차이',
          ONLINE: '온라인 소통의 한계와 오해, 익명성으로 인한 무책임한 행동',
          ETC: '복합적인 원인'
        };
        specificAnalysis = typeAnalysis[conflictType] || '복합적인 원인';
      }
      
      return `${specificAnalysis}이 갈등의 근본 원인으로 분석됩니다. 온라인 환경에서는 직접 대면하지 않은 채로 웅심이 커질 수 있으며, 문제 해결이 더욱 어려울 수 있습니다.`;
    };

    // 내 입장 분석
    const analyzeMyPosition = () => {
      const priorityContext = {
        RELATIONSHIP: '관계 보전을 중시하면서도',
        SOLUTION: '문제 해결을 우선시하면서',
        SELF_CARE: '자신의 보호를 고려하면서',
        PREVENTION: '재발 방지를 염두에 두면서',
        NONE: '명확한 우선순위 없이'
      };
      
      const talkContext = {
        YES: '적극적으로 대화하고 싶어하며',
        MAYBE: '상황에 따라 대화할 의향이 있으며',
        NO: '현재는 대화하기 어려운 상황이지만',
        NONE: '대화에 대한 입장이 불분명하며'
      };
      
      // 갈등 내용에 따른 구체적 분석
      let specificPosition = '';
      if (description.includes('사기') || description.includes('속았')) {
        specificPosition = '사기를 당한 피해자로서 배신감과 분노를 느끼며, 상대방으로부터 사과와 보상을 받고 싶어합니다. 또한 이런 일이 다시 반복되지 않기를 바란다';
      } else if (description.includes('돈') || description.includes('비용')) {
        specificPosition = '경제적 부담으로 인한 스트레스를 받고 있으며, 보다 공평한 비용 분담을 원하고 있다';
      } else {
        specificPosition = `"${desiredOutcome || '문제가 해결되기를 바라고 있다'}"라는 목표를 가지고 있다`;
      }
      
      return `${priorityContext[priority] || '상황을 종합적으로 고려하면서'} ${talkContext[talkWillingness] || '상황을 지켜보고 있으며'}, ${specificPosition}. 현재 감정적으로 상처받은 상태로 명확한 해결책을 찾고자 합니다.`;
    };

    // 상대방 입장 추정
    const estimatePartnerPosition = () => {
      let partnerAnalysis = '';
      
      // 갈등 내용에 따른 구체적 분석
      if (description.includes('사기') || description.includes('속았')) {
        if (description.includes('메이플') || description.includes('게임')) {
          partnerAnalysis = '온라인 게임에서의 사기 행위를 저지른 상대방은 자신의 행동이 상대방에게 얼마나 큰 상처를 주었는지 인식하지 못하고 있을 수 있습니다. 아니면 장난으로 생각하거나, 게임 내에서의 일이라 현실과 다르다고 합리화하고 있을 가능성도 있습니다';
        } else {
          partnerAnalysis = '사기 행위를 저지른 상대방은 자신의 행동에 대한 죄책감을 느끼거나, 아니면 발각되지 않을 것이라 생각하고 있을 수 있습니다';
        }
      } else if (conflictType === 'WORK') {
        partnerAnalysis = '업리에 집중하다 보니 다른 사람의 감정을 고려할 여유가 없었을 수 있습니다';
      } else if (conflictType === 'FAMILY') {
        partnerAnalysis = '가족 내에서의 역할과 책임에 대한 다른 인식을 가지고 있을 수 있습니다';
      } else if (conflictType === 'COUPLE') {
        partnerAnalysis = '관계에서의 기대치와 소통 방식에 대한 다른 견해를 가지고 있을 수 있습니다';
      } else {
        partnerAnalysis = '각자의 상황과 배경이 다르기 때문에 문제에 대한 인식과 해결 방향에 차이가 있을 수 있습니다';
      }
      
      // 갈등 강도에 따른 추가 분석
      const intensityContext = intensity >= 7 
        ? '갈등의 심각성을 아직 충분히 인식하지 못했거나, 자신의 지위나 이익을 지키려고 할 수 있습니다' 
        : '시간이 지나면 자연스럽게 해결될 것이라고 생각하고 있을 수 있습니다';
      
      return `상대방은 ${partnerAnalysis}. ${intensityContext}. 직접적인 대면을 피하고 싶어하거나, 아직 문제의 심각성을 제대로 인식하지 못했을 가능성이 높습니다.`;
    };

    return {
      emotionAnalysis: analyzeEmotion(),
      conflictAnalysis: analyzeConflict(),
      myPosition: analyzeMyPosition(),
      partnerPosition: estimatePartnerPosition()
    };
  };
  const fetchTempConflictData = async () => {
    try {
      // sessionStorage에서 데이터 가져오기 (실제 데이터 우선)
      const basicData = {
        title: sessionStorage.getItem('tempTitle') || '갈등 제목',
        description: sessionStorage.getItem('tempDescription') || '갈등 설명',
        conflictType: sessionStorage.getItem('tempConflictType') || 'ETC',
        aiSummary: sessionStorage.getItem('tempAiSummary') || '분석 결과를 불러오는 중입니다...',
        aiSolutions: sessionStorage.getItem('tempAiSolutions') || '해결방안을 불러오는 중입니다...',
        // ConflictDetailPage 스타일로 추가 데이터
        createdAt: new Date().toISOString(),
        intensity: parseInt(sessionStorage.getItem('tempIntensity')) || 7,
        initialEmotion: sessionStorage.getItem('tempEmotion') || 'FRUSTRATION',
        priority: sessionStorage.getItem('tempPriority') || 'SOLUTION',
        talkWillingness: sessionStorage.getItem('tempTalkWillingness') || 'MAYBE',
        desiredOutcome: sessionStorage.getItem('tempDesiredOutcome') || '문제를 해결하고 싶어요',
      };
      
      console.log('sessionStorage에서 가져온 기본 데이터:', basicData);

      // 실제 데이터를 기반으로 AI 분석 수행
      const aiAnalysis = generateAIAnalysis(basicData);
      console.log('AI 분석 결과:', aiAnalysis);
      
      // AI 분석 결과를 sessionStorage에서 가져오되, 없으면 실시간 분석 결과 사용
      const finalEmotionAnalysis = sessionStorage.getItem('tempEmotionAnalysis') || aiAnalysis.emotionAnalysis;
      const finalConflictAnalysis = sessionStorage.getItem('tempConflictAnalysis') || aiAnalysis.conflictAnalysis;
      const finalMyPosition = sessionStorage.getItem('tempMyPosition') || aiAnalysis.myPosition;
      const finalPartnerPosition = sessionStorage.getItem('tempPartnerPosition') || aiAnalysis.partnerPosition;
      
      // 최종 데이터 조합
      const tempData = {
        ...basicData,
        // AI 분석 결과 적용
        emotionAnalysis: finalEmotionAnalysis,
        conflictAnalysis: finalConflictAnalysis,
        myPosition: finalMyPosition,
        partnerPosition: finalPartnerPosition,
        priorityRecommendation: basicData.intensity >= 8 ? '즉각적 전문가 도움 필요' : basicData.priority === 'RELATIONSHIP' ? '관계 유지 중심 접근' : '문제 해결 중심 접근',
        recommendedActions: JSON.stringify([
          `${basicData.conflictType} 갈등의 특성을 이해하고 상황 분석하기`,
          '자신의 감정을 정리하고 객관적 시각 갖기',
          basicData.talkWillingness === 'YES' ? '적극적인 대화로 문제 해결 시도하기' : '대화 가능한 환경과 시점 마련하기',
          '구체적이고 실현 가능한 해결책 모색하기',
          '갈등 해결 후 관계 정상화 및 예방 계획 세우기'
        ])
      };
      
      console.log('AI가 분석한 데이터:', tempData);
      setConflictData(tempData);
    } catch (error) {
      console.error('임시 갈등 데이터 조회 실패:', error);
      // 기본 데이터 설정
      setConflictData({
        title: '갈등 제목',
        description: '갈등 설명',
        conflictType: 'ETC',
        aiSummary: '분석 결과를 가져오지 못했습니다.',
        aiSolutions: '해결방안을 가져오지 못했습니다.',
        createdAt: new Date().toISOString(),
        intensity: '5',
        emotionAnalysis: '감정 분석 데이터가 없습니다.',
        conflictAnalysis: '갈등 분석 데이터가 없습니다.',
        relationshipHealthScore: 50,
        communicationScore: 50
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
      navigate('/conflicts');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/conflicts');
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

  // 각 서비스 페이지로 이동하는 핸들러들
  const handleConflictResolution = () => {
    createVideoCallRoom(); // 갈등해결하기 -> 화상채팅 방 생성
  };

  const handleComfort = () => {
    navigate('/comfort'); // 토닥토닥 -> comfort (챗봇)
  };

  const handleCommunity = () => {
    handleShareConflict(); // 갈등 커뮤니티 -> 갈등 내용을 커뮤니티로 공유
  };

  const handleExpertMatching = () => {
    navigate('/expert-matching'); // 전문상담사 매칭 -> 더미페이지
  };

  const handleRoadmap = () => {
    navigate('/roadmap'); // 로드맵 페이지로 이동
  };

  const handleNewConflict = () => {
    navigate('/conflicts/create');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-gray-600">결과를 불러오는 중...</p>
          {/* 전문상담사 매칭 카드 */}
          <div 
            className="text-white rounded-3xl p-10 relative overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:-translate-y-2 shadow-xl"
            style={{ background: '#EE9278' }}
          >
            <h3 className="text-2xl font-bold mb-6">전문상담사 매칭</h3>
            <p className="mb-8 leading-relaxed opacity-90">
              나의 대화중재 기록을 확인하고<br/>
              관리해요
            </p>
            <div className="absolute bottom-8 right-8">
              <span className="text-2xl">→</span>
            </div>
          </div>
        </div>
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
                      {JSON.parse(conflictData.recommendedActions).map((action, index) => (
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
