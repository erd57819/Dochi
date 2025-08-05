import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import useAuthStore from '../stores/AuthStore';
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

  const fetchTempConflictData = async () => {
    try {
      // sessionStorage에서 데이터 가져오기
      const tempData = {
        title: sessionStorage.getItem('tempTitle') || '갈등 제목',
        description: sessionStorage.getItem('tempDescription') || '갈등 설명',
        conflictType: sessionStorage.getItem('tempConflictType') || 'ETC',
        aiSummary: sessionStorage.getItem('tempAiSummary') || '분석 결과를 불러오는 중입니다...',
        aiSolutions: sessionStorage.getItem('tempAiSolutions') || '해결방안을 불러오는 중입니다...',
        // ConflictDetailPage 스타일로 추가 데이터
        createdAt: new Date().toISOString(),
        intensity: sessionStorage.getItem('tempIntensity') || '7',
        initialEmotion: sessionStorage.getItem('tempEmotion') || 'FRUSTRATION',
        priority: sessionStorage.getItem('tempPriority') || 'SOLUTION',
        talkWillingness: sessionStorage.getItem('tempTalkWillingness') || 'MAYBE',
        desiredOutcome: sessionStorage.getItem('tempDesiredOutcome') || '문제를 해결하고 싶어요',
        // 가짜 AI 분석 데이터 (예시용)
        emotionAnalysis: '현재 감정 상태는 주로 좌절감과 피로감이 주를 이루고 있습니다. 서로에 대한 이해와 배려가 필요한 상황으로 보입니다.',
        conflictAnalysis: '집안일 분담에 대한 인식의 차이와 소통 부족이 주요 원인으로 분석됩니다. 양자간 역할 분담에 대한 명확한 합의가 필요합니다.',
        // AI가 생성한 입장 정리 (실제로는 AI API에서 받아올 데이터)
        myPosition: '집안일을 혼자 감당하기엔 너무 벅차고, 파트너의 도움과 이해가 필요한 상황입니다. 공평한 분담을 통해 서로 배려하며 살고 싶습니다.',
        partnerPosition: '직장에서의 피로와 스트레스로 인해 집에서는 휴식을 취하고 싶어하는 마음이 있으나, 파트너의 부담을 덜어주어야 한다는 것도 알고 있습니다.',
        relationshipHealthScore: 75,
        communicationScore: 65,
        trustScore: JSON.stringify({ score: 70, analysis: '기본적인 신뢰는 있으나 소통 개선이 필요합니다.' }),
        cooperationScore: JSON.stringify({ 
          score: 60, 
          improvement_suggestions: [
            '집안일 역할 분담표 작성하기',
            '주간 가족 회의 시간 마련하기',
            '서로의 업무 강도 이해하기'
          ]
        }),
        priorityRecommendation: '관계 유지와 문제 해결을 병행하는 접근법을 추천합니다. 먼저 서로의 입장을 충분히 듣고 이해한 후, 현실적인 해결방안을 함께 찾아보세요.',
        recommendedActions: JSON.stringify([
          '집안일에 대한 서로의 인식과 기대치 점검하기',
          '일주일 단위로 역할 분담 계획 세우기',
          '서로의 업무 스케줄과 에너지 레벨 대화하기',
          '외부 도움(가사 도움, 가전제품 활용) 방안 검토하기'
        ])
      };
      
      console.log('Loaded temp data:', tempData);
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
    if (!tempId) {
      alert('임시 저장된 갈등 데이터가 없습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/conflict/analyze/advanced/save/${tempId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        alert('갈등 카드가 성공적으로 생성되었습니다! 🦔');
        navigate('/conflicts');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '갈등 카드 생성에 실패했습니다.');
      }
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

  // 각 서비스 페이지로 이동하는 핸들러들
  const handleConflictResolution = () => {
    navigate('/conflict-resolution'); // 참견도치와 갈등 해결하기
  };

  const handleCommunity = () => {
    navigate('/community'); // 갈등 커뮤니티 (토닥토닥 서비스 내용)
  };

  const handleRoadmap = () => {
    navigate('/roadmap'); // 5단계 해결 로드맵
  };

  const handleChatbot = () => {
    navigate('/chatbot'); // 토닥토닥 서비스 (커뮤니티 내용)
  };

  const handleExpertMatching = () => {
    navigate('/expert-matching'); // 전문상담사 매칭
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
    <div className="min-h-screen relative">
      {/* 전체 배경 컨테이너 */}
      <div className="absolute inset-0">
        {/* 상단 배경 - F8D6B3 14% */}
        <div 
          className="absolute top-0 left-0 w-full" 
          style={{ 
            height: '45%',
            backgroundColor: '#F8D6B3',
            opacity: 0.14
          }}
        ></div>
        
        {/* 하단 배경 - 흰색 */}
        <div 
          className="absolute bottom-0 left-0 w-full" 
          style={{ 
            height: '55%',
            backgroundColor: '#FFFFFF'
          }}
        ></div>
      </div>
      {/* 메인 컨텐츠 */}
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
        <div className="p-12 mb-25">
          <h3 className="text-3xl font-bold text-center mb-12" style={{ color: '#333333' }}>
            {conflictData?.title || '집안일 분담 관련 갈등'}
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
              {/* 부부갈등 소제목 */}
              <div className="text-center mt-6">
                <h4 className="text-2xl font-bold" style={{ color: '#333333' }}>
                  {getConflictTypeText(conflictData?.conflictType || 'ETC')}
                </h4>
              </div>
            </div>

            {/* 분석 내용 */}
            <div className="flex-1 space-y-8">
              <div>
                <h4 className="font-bold text-xl mb-4" style={{ color: '#333333' }}>
                  • 상황: {conflictData?.aiSummary || '분석 결과가 없습니다'}
                </h4>
              </div>

              <div>
                <h4 className="font-bold text-xl mb-4" style={{ color: '#333333' }}>
                  • 원인: {conflictData?.description || '갈등 상황이 설명되지 않았습니다'}
                </h4>
              </div>

              <div>
                <h4 className="font-bold text-xl mb-4" style={{ color: '#333333' }}>
                  • 입장 정리:
                </h4>
                <div className="ml-6 space-y-4">
                  <div className="pl-4">
                    <div className="mb-2">
                      <span className="font-medium" style={{ color: '#8B4513' }}>내 입장:</span>
                      <span className="ml-2" style={{ color: '#333333' }}>
                        "{conflictData?.myPosition || conflictData?.desiredOutcome || '내 입장을 명확히 정리하고 싶어요.'}"
                      </span>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: '#8B4513' }}>상대방 입장:</span>
                      <span className="ml-2" style={{ color: '#333333' }}>
                        "{conflictData?.partnerPosition || conflictData?.aiSolutions || '상대방의 입장을 AI가 분석 중입니다.'}"
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 메시지 */}
        <div className="text-center mb-16">
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
              <h3 className="text-2xl font-bold mb-6">참견도치와 갈등 해결하기</h3>
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
              onClick={handleCommunity}
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
            {/* 5단계 해결 로드맵 카드 */}
            <div 
              className="rounded-3xl p-8 relative overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:-translate-y-2"
              style={{ background: '#f8d6b3', color: '#3d2b1f' }}
              onClick={handleRoadmap}
            >
              <h3 className="text-xl font-bold mb-4">5단계<br/>해결 로드맵</h3>
              <p className="mb-6 leading-relaxed opacity-90 text-sm">
                AI 컨설턴트가 제시하는 5단계 갈등 해결 로드맵을 따라가며 갈등을 해결해보세요
              </p>
              <div className="absolute bottom-6 right-6">
                <span className="text-xl">→</span>
              </div>
            </div>

            {/* 갈등 커뮤니티 카드 */}
            <div 
              className="text-white rounded-3xl p-8 relative overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:-translate-y-2"
              style={{ background: '#CD9F6E' }}
              onClick={handleExpertMatching}
            >
              <h3 className="text-xl font-bold mb-4">갈등 커뮤니티</h3>
              <p className="mb-6 leading-relaxed opacity-90 text-sm">
                비슷한 고민을 가진 사람들과 이야기해보세요<br/>
              </p>
              <div className="absolute bottom-6 right-6">
                <span className="text-xl">→</span>
              </div>
            </div>

            {/* 전문상담사 매칭 카드 */}
            <div 
              className="text-white rounded-3xl p-8 relative overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:-translate-y-2"
              style={{ background: '#EE9278' }}
              onClick={handleChatbot}
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
        <div className="flex justify-between gap-6">
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
  );
};

export default ConflictAnalysisResultPage;
