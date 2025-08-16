import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api.js';
import useAuthStore from '../stores/AuthStore.js';
import { videoCallApi } from '../services/videoCallApi.js';
import hedgehogImg from '../assets/conflict.png';
import useComfortStore from '../stores/ComfortStore.js';
import comfortService from '../services/comfortService.js';

const ConflictDetailPage = () => {
  const { conflictId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  
  const [conflict, setConflict] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, analysis, roadmap
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 대화 저장 함수 (ComfortChatPage에서 가져온 함수)
  const saveChatToDatabase = async (currentChatRoomId, currentSessionId) => {
    if (!currentSessionId || !currentChatRoomId) {
      return;
    }
    
    try {
      await comfortService.exitSession(currentSessionId, currentChatRoomId);
      console.log('대화가 성공적으로 저장되었습니다!');
    } catch (error) {
      console.error('대화 저장 실패:', error);
      throw error;
    }
  };

  // 토닥토닥 서비스로 갈등 내용 전달하여 이동
  const handleComfortWithConflict = async () => {
    try {
      // 현재 대화가 있다면 자동으로 저장
      const { currentChatRoomId, currentSessionId, messages } = useComfortStore.getState();
      
      if (currentSessionId && currentChatRoomId && messages && messages.length > 0) {
        const hasUserMessages = messages.some(msg => msg.sender === 'user');
        if (hasUserMessages) {
          await saveChatToDatabase(currentChatRoomId, currentSessionId);
        }
      }
      
      if (conflict) {
        // 갈등 내용을 요약하여 세션 스토리지에 저장
        const conflictSummary = `갈등 상황: ${conflict.conflictSituation || conflict.description || '갈등 상황'}\n` +
                                `상대방: ${conflict.opponentName || conflict.opponent || conflict.partnerName || '상대방'}\n` +
                                `관계: ${conflict.relationship || getConflictTypeText(conflict.conflictType)}\n` +
                                `갈등 내용: ${conflict.conflictContent || conflict.description || '갈등 내용'}`;
        
        sessionStorage.setItem('initialConflictMessage', conflictSummary);
        navigate('/comfort');
      } else {
        navigate('/comfort');
      }
    } catch (error) {
      console.error('토닥토닥 서비스 이동 중 오류:', error);
      // 오류가 발생해도 페이지 이동은 진행
      navigate('/comfort');
    }
  };

  // 분석 데이터 렌더링 헬퍼 함수 (최적화됨)
  const renderAnalysisData = (data) => {
    if (!data) return 'AI가 분석하고 있습니다...';
    if (typeof data === 'string') return data;
    
    // 문자열이 아닌 경우 직접 텍스트로 처리
    return String(data);
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchConflictDetail();
  }, [conflictId, isLoggedIn, navigate]);

  const fetchConflictDetail = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/conflict/${conflictId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const conflictData = result.data || result.response?.response;
        
        // 작성자 확인 - 현재 로그인한 사용자와 갈등 작성자가 다른 경우 접근 차단
        if (user && conflictData.userId && user.userId !== conflictData.userId) {
          console.log('접근 권한 없음 - 작성자:', conflictData.userId, '현재 사용자:', user.userId);
          setError('본인이 작성한 갈등만 조회할 수 있습니다.');
          setTimeout(() => {
            navigate('/mypage', { replace: true });
          }, 2000);
          return;
        }
        
        setConflict(conflictData);
        
        // AI 분석 결과도 함께 조회
        fetchAnalysisResult(conflictId);
      } else if (response.status === 403) {
        setError('본인이 작성한 갈등만 조회할 수 있습니다.');
        setTimeout(() => {
          navigate('/mypage', { replace: true });
        }, 2000);
      } else {
        throw new Error('갈등 상세 정보를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('갈등 상세 조회 오류:', error);
      setError(error.message);
      // 권한 관련 오류가 아닌 경우에도 마이페이지로 리다이렉트
      if (error.message.includes('권한') || error.message.includes('작성자')) {
        setTimeout(() => {
          navigate('/mypage', { replace: true });
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalysisResult = async (conflictId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/conflict/${conflictId}/analysis`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const analysisData = result.data || result.response?.response;
        console.log('📊 AI 분석 결과 원본 데이터:', analysisData);
        
        // recommendedActions 파싱 처리
        if (analysisData) {
          // recommendedActions가 문자열인 경우 파싱
          if (analysisData.recommendedActions && typeof analysisData.recommendedActions === 'string') {
            try {
              analysisData.recommendedActions = JSON.parse(analysisData.recommendedActions);
              console.log('✅ recommendedActions 파싱 성공:', analysisData.recommendedActions);
            } catch (e) {
              console.error('⚠️ recommendedActions 파싱 실패:', e);
              analysisData.recommendedActions = [];
            }
          }
          
          // recommended_actions도 확인 (snake_case)
          if (analysisData.recommended_actions && typeof analysisData.recommended_actions === 'string') {
            try {
              analysisData.recommended_actions = JSON.parse(analysisData.recommended_actions);
              console.log('✅ recommended_actions 파싱 성공:', analysisData.recommended_actions);
            } catch (e) {
              console.error('⚠️ recommended_actions 파싱 실패:', e);
              analysisData.recommended_actions = [];
            }
          }
        }
        
        setAnalysisResult(analysisData);
      } else {
        console.log('AI 분석 결과가 없습니다.');
      }
    } catch (error) {
      console.error('AI 분석 결과 조회 오류:', error);
    }
  };

  const getConflictTypeText = (type) => {
    const types = {
      WORK: '직장/업무',
      FAMILY: '가족',
      FRIEND: '친구',
      COUPLE: '연인/부부',
      NEIGHBOR: '이웃',
      FINANCIAL: '금전',
      ONLINE: '온라인',
      ETC: '기타'
    };
    return types[type] || '기타';
  };

  const getConflictTypeImage = (type) => {
    const images = {
      WORK: '/images/companyDochi.png',
      FAMILY: '/images/familyDochi.png',
      FRIEND: '/images/friendDochi.png',
      COUPLE: '/images/loveDochi.png',
      NEIGHBOR: '/images/soundDochi.png',
      FINANCIAL: '/images/moneyDochi.png',
      ONLINE: '/images/onlineDochi.png',
      ETC: '/images/guitarDochi.png'
    };
    return images[type] || '/images/guitarDochi.png';
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
      SADNESS: '슬픔', 
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

  // 갈등 삭제
  const deleteConflict = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/conflict/${conflictId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('갈등이 성공적으로 삭제되었습니다.');
        navigate('/mypage'); // 갈등 목록 페이지로 이동
      } else {
        throw new Error('갈등 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('갈등 삭제 오류:', error);
      alert('갈등 삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  // 화상채팅 방 생성
  const createVideoCallRoom = async () => {
    try {
      setIsLoading(true);
      
      // 갈등 ID와 함께 화상채팅 방 생성
      const response = await videoCallApi.createRoom(conflictId);
      console.log('화상채팅 방 생성 응답:', response); // 디버깅용
      
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

  // 5단계 해결 로드맵 (AI가 갈등 유형별로 추천)
  const getResolutionRoadmap = (conflictType) => {
    const roadmaps = {
      WORK: [
        { step: 1, title: '상황 정리', desc: '갈등의 핵심 사안을 명확히 파악하고 정리하기', icon: '📝' },
        { step: 2, title: '감정 조절', desc: '충동적인 반응을 피하고 차분한 마음가짐 갖기', icon: '🧘' },
        { step: 3, title: '대화 준비', desc: '상대방과의 건설적 대화를 위한 계획 세우기', icon: '💬' },
        { step: 4, title: '중재자 활용', desc: '필요시 상사나 HR 부서의 도움 요청하기', icon: '🤝' },
        { step: 5, title: '관계 회복', desc: '갈등 해결 후 업무 관계 정상화하기', icon: '✨' }
      ],
      FAMILY: [
        { step: 1, title: '감정 인정', desc: '서로의 감정을 인정하고 받아들이기', icon: '❤️' },
        { step: 2, title: '시간 갖기', desc: '감정이 격할 때는 시간을 두고 생각하기', icon: '⏰' },
        { step: 3, title: '진솔한 대화', desc: '가족 모임을 통해 솔직한 대화 나누기', icon: '👨‍👩‍👧‍👦' },
        { step: 4, title: '타협점 찾기', desc: '서로 양보할 수 있는 지점 찾기', icon: '🤲' },
        { step: 5, title: '사랑 확인', desc: '가족 간의 사랑과 유대감 재확인하기', icon: '💕' }
      ],
      COUPLE: [
        { step: 1, title: '감정 표현', desc: 'I 메시지로 자신의 감정 솔직하게 표현하기', icon: '💭' },
        { step: 2, title: '경청하기', desc: '상대방의 입장을 진심으로 들어보기', icon: '👂' },
        { step: 3, title: '공감대 형성', desc: '서로의 관점에서 상황 이해하기', icon: '💞' },
        { step: 4, title: '해결책 모색', desc: '함께 문제를 해결할 수 있는 방법 찾기', icon: '🔍' },
        { step: 5, title: '관계 강화', desc: '갈등을 통해 더 깊은 관계로 발전시키기', icon: '🌟' }
      ],
      DEFAULT: [
        { step: 1, title: '문제 파악', desc: '갈등의 원인과 핵심 이슈 명확히 하기', icon: '🔍' },
        { step: 2, title: '감정 관리', desc: '부정적 감정을 조절하고 객관적 시각 갖기', icon: '🧠' },
        { step: 3, title: '소통 시도', desc: '상대방과의 건설적인 대화 시도하기', icon: '💬' },
        { step: 4, title: '해결 방안', desc: '구체적이고 실현 가능한 해결책 마련하기', icon: '💡' },
        { step: 5, title: '관계 회복', desc: '갈등 해결 후 관계 정상화 및 발전시키기', icon: '🤝' }
      ]
    };
    return roadmaps[conflictType] || roadmaps.DEFAULT;
  };

  // 추천 서비스 우선순위 (AI가 갈등 분석 결과에 따라 추천)
  const getRecommendedServices = (conflict) => {
    if (!conflict) return [];
    
    const services = [
      {
        name: '화상 채팅',
        icon: '🎥',
        description: '실시간 화상 통화로 대면 대화하기',
        priority: 1,
        suitable: '직접적인 소통이 필요한 경우',
        action: createVideoCallRoom
      },
      {
        name: 'AI 챗봇 상담', 
        icon: '🤖',
        description: 'AI와의 대화를 통한 갈등 해결 방안 모색',
        priority: 2,
        suitable: '혼자서 생각을 정리하고 싶은 경우',
        action: () => alert('AI 챗봇 상담 기능은 준비 중입니다!')
      },
      {
        name: '전문가 매칭',
        icon: '👨‍⚕️',
        description: '갈등 해결 전문가와 상담 연결',
        priority: 3,
        suitable: '심각한 갈등이나 전문적 도움이 필요한 경우',
        action: () => alert('전문가 매칭 기능은 준비 중입니다!')
      }
    ];

    // 갈등 강도와 유형에 따라 우선순위 조정
    if (conflict.intensity >= 8) {
      services[2].priority = 1; // 전문가 매칭을 최우선으로
      services[0].priority = 2;
      services[1].priority = 3;
    } else if (conflict.conflictType === 'FAMILY' || conflict.conflictType === 'COUPLE') {
      services[0].priority = 1; // 화상 채팅을 최우선으로
    }

    return services.sort((a, b) => a.priority - b.priority);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">갈등 상세 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isPermissionError = error.includes('작성자') || error.includes('권한');
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className={`w-20 h-20 ${isPermissionError ? 'bg-yellow-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <span className="text-3xl">{isPermissionError ? '🔒' : '😞'}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {isPermissionError ? '접근 권한이 없습니다' : '오류가 발생했습니다'}
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
          
          {isPermissionError && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                💡 본인이 작성한 갈등만 조회할 수 있습니다.<br/>
                잠시 후 마이페이지로 이동합니다.
              </p>
            </div>
          )}
          
          <button
            onClick={() => navigate('/mypage')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            {isPermissionError ? '마이페이지로 돌아가기' : '목록으로 돌아가기'}
          </button>
        </div>
      </div>
    );
  }

  if (!conflict) return null;

  const roadmap = getResolutionRoadmap(conflict.conflictType);
  const recommendedServices = getRecommendedServices(conflict);

  // 갈등 내용을 3줄로 요약하는 함수
  const generateConflictSummary = (conflict) => {
    if (!conflict) return [];

    const sentences = [];
    
    // 1줄: 갈등 상황 요약
    const situationSummary = conflict.description.length > 100 
      ? conflict.description.substring(0, 100) + "..."
      : conflict.description;
    sentences.push(`📌 상황: ${situationSummary}`);
    
    // 2줄: 갈등 강도와 감정 상태
    const emotionText = getEmotionText(conflict.initialEmotion);
    sentences.push(`💢 갈등 강도: ${conflict.intensity}/10, 주된 감정: ${emotionText}`);
    
    // 3줄: 원하는 결과나 우선순위
    const priorityText = getPriorityText(conflict.priority);
    const desiredOutcome = conflict.desiredOutcome || "해결 방안을 찾고 싶어요";
    sentences.push(`🎯 목표: ${priorityText} 중심으로 ${desiredOutcome}`);
    
    return sentences;
  };

  // 갈등 공유하기 함수 - AI 분석과 함께
  // 갈등 공유하기 함수 - CreatePostPage에서 AI 로딩
  const handleShareConflict = () => {
    if (!conflict) return;

    // 갈등 상황 요약 생성
    const summary = generateConflictSummary(conflict);
    const conflictTypeText = getConflictTypeText(conflict.conflictType);
    const conflictDescription = summary.join('\n');
    
    console.log('🚀 갈등 상세페이지에서 커뮤니티로 이동, AI 분석 데이터:', {
      conflict: conflict,
      summary: summary,
      conflictTypeText: conflictTypeText
    });

    // CreatePostPage로 즉시 이동하면서 갈등 데이터 전달
    navigate('/community/create', {
      state: {
        conflictData: {
          ...conflict,
          conflictTypeText: conflictTypeText,
          summary: summary,
          description: conflictDescription
        },
        targetCategory: 'CONFLICT_SHARING',
        shouldGenerateAI: true // AI 생성 플래그
      }
    });
  };

  return (
    <div className="relative min-h-screen">
      {/* 상단 버튼들 */}
      <div className="absolute top-8 left-4 right-4 z-50 flex justify-between items-center">
        {/* 뒤로 가기 버튼 */}
        <button
          onClick={() => navigate('/mypage')}
          className="text-gray-600 hover:text-gray-800 transition-colors font-medium cursor-pointer"
        >
          ← 뒤로 가기
        </button>
        
        {/* 갈등 삭제 버튼 */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="text-red-500 hover:text-red-700 transition-colors font-medium cursor-pointer"
        >
          갈등 삭제
        </button>
      </div>

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
            <h2 className="text-5xl font-bold mb-4" style={{ 
              background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              갈등 상세 분석 결과
            </h2>
          </div>

          {/* 갈등 분석 카드 */}
          <div className="p-12 mb-12">
            <h3 className="text-3xl font-bold text-center mb-12" style={{ color: '#333333' }}>
              {conflict?.title || '갈등 제목'}
            </h3>

            {/* 갈등 분석과 이미지 레이아웃 */}
            <div className="space-y-8">
              {/* 이미지와 갈등 분석 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* 이미지 영역 */}
                <div className="text-center">
                  <div 
                    className="w-60 h-60 mx-auto rounded-full flex items-center justify-center shadow-lg mb-6"
                    style={{ background: 'linear-gradient(135deg, #E8E8E8, #D0D0D0)' }}
                  >
                    <img 
                      src={getConflictTypeImage(conflict?.conflictType || 'ETC')} 
                      alt={`${getConflictTypeText(conflict?.conflictType || 'ETC')} 도치`} 
                      className="w-44 h-44 object-contain"
                      onError={(e) => {
                        // 이미지 로드 실패 시 기본 이미지로 대체
                        e.target.src = hedgehogImg;
                      }}
                    />
                  </div>
                  <h4 className="text-2xl font-bold" style={{ color: '#333333' }}>
                    {getConflictTypeText(conflict?.conflictType || 'ETC')}
                  </h4>
                </div>

                {/* 갈등 분석 */}
                <div className="bg-white p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">
                    갈등 분석
                  </h4>
                  <div 
                    className="text-gray-700"
                    style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{
                      __html: renderAnalysisData(
                        analysisResult?.conflictAnalysis || analysisResult?.conflict_analysis ||
                        `갈등 상황: ${conflict?.description || '상세 정보가 없습니다.'}`
                      )
                    }}
                  />
                </div>
              </div>


              {/* 입장 정리 - 갈등 분석 아래로 */}
              <div className="bg-white p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-gray-600">•</span> 입장 정리
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4">
                    <div className="mb-3">
                      <span className="font-medium text-amber-700">내 입장 (AI 분석):</span>
                      <div 
                        className="mt-1 text-gray-700"
                        style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}
                        dangerouslySetInnerHTML={{
                          __html: renderAnalysisData(
                            analysisResult?.myPosition || analysisResult?.my_position ||
                            `갈등 상황: ${conflict?.description || '정보 없음'}`
                          )
                        }}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4">
                    <div>
                      <span className="font-medium text-amber-800">상대방 입장 (AI 추정):</span>
                      <div 
                        className="mt-1 text-gray-700"
                        style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}
                        dangerouslySetInnerHTML={{
                          __html: renderAnalysisData(
                            analysisResult?.partnerPosition || analysisResult?.partner_position ||
                            `갈등 유형: ${getConflictTypeText(conflict?.conflictType)}, 갈등 강도: ${conflict?.intensity || 0}/10`
                          )
                        }}
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
          {/* 하단 메시지 - 간단한 스타일 */}
          <div className="text-center mb-16 pt-12">
            <h2 className="text-5xl font-bold" style={{ 
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
                onClick={handleComfortWithConflict}
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
                onClick={() => {
                  // 분석 결과를 sessionStorage에 저장하고 로드맵으로 이동
                  if (conflict && analysisResult) {
                    console.log('🚀 ConflictDetailPage에서 로드맵으로 데이터 전달:', analysisResult);
                    
                    // recommendedActions 처리 - 이미 fetchAnalysisResult에서 파싱됨
                    let recommendedActions = analysisResult.recommendedActions || 
                                           analysisResult.recommended_actions || 
                                           analysisResult.recommendedAction ||
                                           analysisResult.recommended_action;
                    
                    // 이미 파싱된 객체인지 확인
                    if (recommendedActions && typeof recommendedActions === 'object') {
                      // 객체 형태면 그대로 사용
                      console.log('📋 이미 파싱된 recommendedActions 사용:', recommendedActions);
                    } else if (typeof recommendedActions === 'string') {
                      // 문자열인 경우 JSON 파싱 시도
                      try {
                        recommendedActions = JSON.parse(recommendedActions);
                      } catch (e) {
                        console.log('recommendedActions 파싱 실패, 빈 배열 사용');
                        recommendedActions = [];
                      }
                    } else {
                      // null이거나 undefined인 경우
                      recommendedActions = [];
                    }
                    
                    console.log('📋 최종 처리된 recommendedActions:', recommendedActions);
                    
                    // ConflictAnalysisResultPage와 동일한 데이터 구조로 맞춤
                    const analysisDataForRoadmap = {
                      ...conflict,
                      aiSummary: conflict.aiSummary || analysisResult?.conflictAnalysis || analysisResult?.conflict_analysis || '분석을 생성할 수 없습니다.',
                      aiSolutions: conflict.aiSolutions || (recommendedActions ? JSON.stringify(recommendedActions) : '해결방안을 생성할 수 없습니다.'),
                      conflictAnalysis: analysisResult?.conflictAnalysis || analysisResult?.conflict_analysis || '',
                      myPosition: analysisResult?.myPosition || analysisResult?.my_position || '내 입장을 AI가 분석해서 정리해드립니다.',
                      partnerPosition: analysisResult?.partnerPosition || analysisResult?.partner_position || '상대방의 입장을 AI가 추정해서 분석해드립니다.',
                      relationshipHealthScore: analysisResult?.relationshipHealthScore || analysisResult?.relationship_health_score || 0,
                      communicationScore: analysisResult?.communicationScore || analysisResult?.communication_score || 0,
                      trustScore: analysisResult?.trustScore || analysisResult?.trust_score || { score: 0, analysis: '' },
                      cooperationScore: analysisResult?.cooperationScore || analysisResult?.cooperation_score || { score: 0, improvement_suggestions: [] },
                      priorityRecommendation: analysisResult?.priorityRecommendation || analysisResult?.priority_recommendation || '',
                      recommendedActions: recommendedActions
                    };
                    
                    console.log('💾 sessionStorage에 저장할 데이터:', analysisDataForRoadmap);
                    sessionStorage.setItem('conflictAnalysisData', JSON.stringify(analysisDataForRoadmap));
                  } else {
                    console.log('⚠️ 분석 데이터가 없어서 기본 로드맵 사용');
                    // 분석 데이터가 없어도 기본 갈등 데이터는 전달
                    const basicDataForRoadmap = {
                      ...conflict,
                      aiSummary: conflict.aiSummary || '분석을 생성할 수 없습니다.',
                      aiSolutions: conflict.aiSolutions || '해결방안을 생성할 수 없습니다.',
                      conflictAnalysis: '',
                      myPosition: '내 입장을 AI가 분석해서 정리해드립니다.',
                      partnerPosition: '상대방의 입장을 AI가 추정해서 분석해드립니다.',
                      relationshipHealthScore: 0,
                      communicationScore: 0,
                      trustScore: { score: 0, analysis: '' },
                      cooperationScore: { score: 0, improvement_suggestions: [] },
                      priorityRecommendation: '',
                      recommendedActions: []
                    };
                    sessionStorage.setItem('conflictAnalysisData', JSON.stringify(basicDataForRoadmap));
                  }
                  navigate('/roadmap');
                }}
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
                onClick={() => navigate('/expert-matching')}
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
        </main>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">갈등 삭제</h3>
              <p className="text-gray-600 mb-6">
                정말로 이 갈등을 삭제하시겠습니까?<br/>
                삭제된 갈등은 복구할 수 없습니다.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={deleteConflict}
                  disabled={isLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? '삭제 중...' : '삭제하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConflictDetailPage;