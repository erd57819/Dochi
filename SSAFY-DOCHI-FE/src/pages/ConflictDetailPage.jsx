import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api.js';
import useAuthStore from '../stores/AuthStore.js';
import { videoCallApi } from '../services/videoCallApi.js';

const ConflictDetailPage = () => {
  const { conflictId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  
  const [conflict, setConflict] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, analysis, roadmap

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
        setConflict(conflictData);
        
        // AI 분석 결과도 함께 조회
        fetchAnalysisResult(conflictId);
      } else {
        throw new Error('갈등 상세 정보를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('갈등 상세 조회 오류:', error);
      setError(error.message);
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😞</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/conflicts')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            목록으로 돌아가기
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

  // 갈등 공유하기 함수
  const handleShareConflict = () => {
    if (!conflict) return;

    const summary = generateConflictSummary(conflict);
    const conflictTypeText = getConflictTypeText(conflict.conflictType);
    
    // 자동 생성된 제목
    const autoTitle = `[${conflictTypeText}] 갈등 상황 공유 - 조언 구합니다`;
    
    // 자동 생성된 내용 (찬반 투표 형식)
    const autoContent = `안녕하세요! 갈등 상황을 공유하며 여러분의 의견을 듣고 싶습니다.

${summary.join('\n')}

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/conflicts')}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <span className="text-lg">←</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{conflict.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                    {getConflictTypeText(conflict.conflictType)}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {new Date(conflict.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleShareConflict}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                <span>📢</span>
                갈등 공유하기
              </button>
              <div className="text-right">
                <div className="text-sm text-gray-500">갈등 강도</div>
                <div className="text-lg font-bold text-red-600">{conflict.intensity}/10</div>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'text-orange-600 border-b-2 border-orange-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 갈등 개요
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'analysis' 
                  ? 'text-orange-600 border-b-2 border-orange-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🔍 AI 분석 결과
            </button>
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'roadmap' 
                  ? 'text-orange-600 border-b-2 border-orange-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🗺️ 해결 로드맵
            </button>
          </div>

          <div className="p-6">
            {/* 갈등 개요 탭 */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">갈등 상황</h3>
                      <p className="text-gray-700 leading-relaxed">{conflict.description}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">원하는 결과</h3>
                      <p className="text-gray-700 leading-relaxed">{conflict.desiredOutcome || '명시되지 않음'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-1">중요한 가치</h4>
                        <p className="text-gray-600">{getPriorityText(conflict.priority)}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-1">주된 감정</h4>
                        <p className="text-gray-600">{getEmotionText(conflict.initialEmotion)}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-1">대화 의지</h4>
                        <p className="text-gray-600">{getTalkWillingnessText(conflict.talkWillingness)}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-1">발생 빈도</h4>
                        <p className="text-gray-600">월 {conflict.conflictFrequency || 0}회</p>
                      </div>
                    </div>

                    {conflict.participants && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">관련 인물</h4>
                        <div className="flex flex-wrap gap-2">
                          {JSON.parse(conflict.participants).map((person, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {person}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI 요약 */}
                {conflict.aiSummary && (
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">🤖 AI 분석 요약</h3>
                    <div className="text-gray-700 whitespace-pre-line">{conflict.aiSummary}</div>
                  </div>
                )}
              </div>
            )}

            {/* AI 분석 결과 탭 */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                {analysisResult ? (
                  <div className="space-y-6">
                    {/* 감정 분석 */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <span>😊</span> 감정 분석
                      </h4>
                      <p className="text-blue-700">{analysisResult.emotionAnalysis}</p>
                    </div>

                    {/* 갈등 분석 */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                        <span>⚡</span> 갈등 분석
                      </h4>
                      <p className="text-purple-700">{analysisResult.conflictAnalysis}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🔍</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">상세 AI 분석</h3>
                    <p className="text-gray-500 mb-6">
                      이 갈등에 대한 상세한 AI 분석 결과가 없습니다.
                    </p>
                    <p className="text-gray-400 text-sm">
                      * 고급 분석은 새로운 갈등 카드 생성 시에만 제공됩니다.
                    </p>
                  </div>
                )}

                {/* 우선순위 추천 */}
                {analysisResult?.priorityRecommendation && (
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6 mt-6">
                    <h4 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                      <span>⭐</span> AI 우선순위 추천
                    </h4>
                    <p className="text-yellow-700 font-medium">{analysisResult.priorityRecommendation}</p>
                  </div>
                )}

                {/* 추천 행동 */}
                {analysisResult?.recommendedActions && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span>💡</span> AI 추천 행동
                    </h4>
                    <ul className="space-y-2">
                      {JSON.parse(analysisResult.recommendedActions).map((action, index) => (
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
            )}

            {/* 해결 로드맵 탭 */}
            {activeTab === 'roadmap' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">5단계 해결 로드맵</h3>
                  <p className="text-gray-600">AI가 추천하는 단계별 갈등 해결 방법입니다</p>
                </div>

                {/* 로드맵 단계들 */}
                <div className="space-y-4">
                  {roadmap.map((step, index) => (
                    <div key={step.step} className="relative">
                      {/* 연결선 */}
                      {index < roadmap.length - 1 && (
                        <div className="absolute left-8 top-16 w-0.5 h-8 bg-gray-300"></div>
                      )}
                      
                      <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">{step.icon}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                              {step.step}단계
                            </span>
                            <h4 className="text-lg font-semibold text-gray-800">{step.title}</h4>
                          </div>
                          <p className="text-gray-600">{step.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 추천 서비스 */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 추천 서비스 (우선순위순)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendedServices.map((service, index) => (
                      <div key={service.name} className="relative">
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {service.priority}
                        </div>
                        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                          <div className="text-center mb-3">
                            <div className="text-3xl mb-2">{service.icon}</div>
                            <h4 className="font-semibold text-gray-800">{service.name}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                          <p className="text-xs text-blue-600 mb-4">💡 {service.suitable}</p>
                          <button
                            onClick={service.action}
                            className="w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                          >
                            시작하기
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictDetailPage;