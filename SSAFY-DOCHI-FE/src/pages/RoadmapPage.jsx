import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import hedgehogImg from '../assets/conflict.png';

const RoadmapPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [conflictAnalysis, setConflictAnalysis] = useState(null);
  const [dynamicSteps, setDynamicSteps] = useState([]);
  
  // 분석 결과 로드 및 동적 스텝 생성
  useEffect(() => {
    console.log('🔍 로드맵 데이터 로드 시작');
    
    // ConflictDetailPage나 ConflictAnalysisResultPage에서 설정된 분석 데이터 확인
    const analysisData = sessionStorage.getItem('conflictAnalysisData');
    
    // ConflictAnalysisResultPage에서 저장된 AI 분석 결과 확인
    const tempAiSummary = sessionStorage.getItem('tempAiSummary');
    const tempAiSolutions = sessionStorage.getItem('tempAiSolutions');
    
    console.log('📊 SessionStorage 확인:');
    console.log('- conflictAnalysisData:', analysisData ? 'exists' : 'not found');
    console.log('- tempAiSummary:', tempAiSummary ? 'exists' : 'not found');
    console.log('- tempAiSolutions:', tempAiSolutions ? 'exists' : 'not found');
    
    if (analysisData) {
      try {
        const parsedData = JSON.parse(analysisData);
        console.log('✅ 분석 데이터 파싱 성공:', parsedData);
        setConflictAnalysis(parsedData);
        
        // AI 분석 결과로부터 동적 스텝 생성
        if (parsedData.recommendedActions || parsedData.recommended_actions) {
          console.log('🚀 AI 추천 액션 발견, 동적 스텝 생성 중...');
          const recommendedActions = parsedData.recommendedActions || parsedData.recommended_actions;
          console.log('추천 액션 데이터:', recommendedActions);
          
          const steps = createDynamicSteps(recommendedActions);
          setDynamicSteps(steps);
        } else {
          console.log('⚠️ 추천 액션 없음 - 기본 스텝 사용');
          setDynamicSteps(getDefaultSteps());
        }
      } catch (error) {
        console.error('❌ 분석 데이터 파싱 에러:', error);
        setDynamicSteps(getDefaultSteps());
      }
    } else if (tempAiSummary && tempAiSolutions) {
      // ConflictAnalysisResultPage에서 온 경우, 기본 AI 분석 결과를 활용
      console.log('📝 기본 AI 분석 결과를 기반으로 로드맵 생성');
      console.log('AI Solutions:', tempAiSolutions);
      
      // 기본 AI 솔루션을 파싱하여 로드맵 단계로 변환
      const solutions = tempAiSolutions.split('\n').filter(line => line.trim().length > 0);
      console.log('파싱된 솔루션:', solutions);
      
      if (solutions.length > 0) {
        const simplifiedActions = {
          immediate: solutions.slice(0, Math.ceil(solutions.length / 5)),
          shortTerm: solutions.slice(Math.ceil(solutions.length / 5), Math.ceil(solutions.length * 2 / 5)),
          midTerm: solutions.slice(Math.ceil(solutions.length * 2 / 5), Math.ceil(solutions.length * 3 / 5)),
          longTerm: solutions.slice(Math.ceil(solutions.length * 3 / 5), Math.ceil(solutions.length * 4 / 5)),
          alternative: solutions.slice(Math.ceil(solutions.length * 4 / 5))
        };
        
        console.log('생성된 단계별 액션:', simplifiedActions);
        const steps = createDynamicSteps(simplifiedActions);
        setDynamicSteps(steps);
      } else {
        console.log('📋 AI 솔루션이 비어있음 - 기본 스텝 사용');
        setDynamicSteps(getDefaultSteps());
      }
    } else {
      console.log('📋 분석 데이터 없음 - 기본 스텝 사용');
      setDynamicSteps(getDefaultSteps());
    }
  }, []);

  // AI 분석 결과를 기반으로 동적 스텝 생성
  const createDynamicSteps = (recommendedActions) => {
    console.log('🔨 createDynamicSteps 호출, 입력 데이터:', recommendedActions);
    
    let processedActions;
    
    // recommendedActions가 배열인 경우 단계별로 나누기
    if (Array.isArray(recommendedActions)) {
      console.log('📋 배열 형태의 추천 액션을 단계별로 분할');
      const actions = recommendedActions.filter(action => action && action.trim().length > 0);
      processedActions = {
        immediate: actions.slice(0, Math.ceil(actions.length / 5)),
        shortTerm: actions.slice(Math.ceil(actions.length / 5), Math.ceil(actions.length * 2 / 5)),
        midTerm: actions.slice(Math.ceil(actions.length * 2 / 5), Math.ceil(actions.length * 3 / 5)),
        longTerm: actions.slice(Math.ceil(actions.length * 3 / 5), Math.ceil(actions.length * 4 / 5)),
        alternative: actions.slice(Math.ceil(actions.length * 4 / 5))
      };
    } else if (typeof recommendedActions === 'object' && recommendedActions !== null) {
      console.log('🗂️ 객체 형태의 추천 액션 사용');
      processedActions = recommendedActions;
    } else {
      console.log('⚠️ 예상치 못한 추천 액션 형태');
      processedActions = {
        immediate: [],
        shortTerm: [],
        midTerm: [],
        longTerm: [],
        alternative: []
      };
    }
    
    console.log('✅ 처리된 액션 데이터:', processedActions);
    
    const steps = [
      {
        id: 1,
        title: "즉시 실행 (감정 조절)",
        description: "오늘~내일 안에 할 수 있는 응급처치",
        content: "감정이 격해질 때 즉시 실행할 수 있는 응급 대응 방법입니다.",
        actions: processedActions.immediate || [],
        period: "오늘~내일",
        color: "#83673f"
      },
      {
        id: 2,
        title: "단기 해결책",
        description: "1-2주 내에 실행할 구체적인 행동",
        content: "갈등의 직접적인 해결을 위한 첫 걸음입니다.",
        actions: processedActions.shortTerm || [],
        period: "1-2주 내",
        color: "#cd9f6e"
      },
      {
        id: 3,
        title: "중기 관계 회복",
        description: "1-3개월 동안 진행할 관계 개선 전략",
        content: "신뢰를 회복하고 관계를 재건하는 단계입니다.",
        actions: processedActions.midTerm || [],
        period: "1-3개월",
        color: "#f8d6b3"
      },
      {
        id: 4,
        title: "장기 예방 및 성장",
        description: "3개월 이상의 지속적인 관계 발전",
        content: "갈등 재발 방지와 더 나은 관계로의 성장입니다.",
        actions: processedActions.longTerm || [],
        period: "3개월 이상",
        color: "#EE9278"
      },
      {
        id: 5,
        title: "대안 계획",
        description: "문제가 해결되지 않을 때의 Plan B",
        content: "모든 노력에도 불구하고 해결되지 않을 때의 대안입니다.",
        actions: processedActions.alternative || [],
        period: "필요시",
        color: "#7F5539"
      }
    ];
    
    console.log('🎯 최종 생성된 스텝:', steps);
    return steps;
  };

  // 기본 스텝 (AI 분석이 없을 때)
  const getDefaultSteps = () => {
    return [
      {
        id: 1,
        title: "갈등 상황 인식",
        description: "현재 갈등 상황을 명확히 파악하고 정리해보세요",
        content: "갈등의 원인, 관련된 사람들, 그리고 현재 상황을 객관적으로 분석해보는 단계입니다.",
        actions: [
          "갈등이 언제부터 시작되었는지 파악하기",
          "갈등의 핵심 원인 찾아보기",
          "관련된 모든 사람들의 입장 정리하기"
        ],
        period: "지금 바로",
        color: "#83673f"
      },
      {
        id: 2,
        title: "감정 정리하기",
        description: "자신과 상대방의 감정을 이해하고 정리해보세요",
        content: "갈등 상황에서 느끼는 감정들을 인정하고, 상대방의 입장에서도 생각해보는 시간을 가져보세요.",
        actions: [
          "내가 느끼는 감정을 솔직하게 인정하기",
          "상대방이 느낄 수 있는 감정 생각해보기",
          "감정에 휩쓸리지 않고 객관적으로 바라보기"
        ],
        period: "1-2일 내",
        color: "#cd9f6e"
      },
      {
        id: 3,
        title: "대화 준비하기",
        description: "건설적인 대화를 위한 준비를 해보세요",
        content: "무엇을 말할지, 어떤 방식으로 대화할지 미리 계획을 세워보는 단계입니다.",
        actions: [
          "대화의 목표 명확히 하기",
          "말하고 싶은 내용 정리하기",
          "상대방의 이야기를 들을 준비하기"
        ],
        period: "1주일 내",
        color: "#f8d6b3"
      },
      {
        id: 4,
        title: "대화 실행하기",
        description: "준비된 내용을 바탕으로 실제 대화를 진행해보세요",
        content: "서로의 이야기를 듣고, 공감하며, 해결방안을 함께 찾아가는 단계입니다.",
        actions: [
          "차분하고 존중하는 태도로 대화하기",
          "서로의 입장을 충분히 듣기",
          "함께 해결방안 찾아보기"
        ],
        period: "2-4주 내",
        color: "#EE9278"
      },
      {
        id: 5,
        title: "관계 회복하기",
        description: "갈등 해결 후 관계를 더욱 발전시켜 나가세요",
        content: "갈등을 통해 배운 점들을 바탕으로 더 나은 관계를 만들어가는 단계입니다.",
        actions: [
          "해결된 내용을 서로 확인하기",
          "앞으로의 관계 개선 방안 논의하기",
          "갈등 경험을 통한 성장 인정하기"
        ],
        period: "지속적으로",
        color: "#7F5539"
      }
    ];
  };

  const steps = dynamicSteps;

  const handleGoBack = () => {
    navigate(-1);
  };


  const handleStepClick = (stepId) => {
    setCurrentStep(stepId);
  };

  const currentStepData = steps.find(step => step.id === currentStep) || steps[0] || {
    id: 1,
    title: "로딩중...",
    description: "분석 결과를 불러오는 중입니다.",
    content: "잠시만 기다려주세요.",
    actions: [],
    period: "",
    color: "#83673f"
  };

  return (
    <div className="min-h-screen relative">
      {/* 전체 배경 컨테이너 */}
      <div className="absolute inset-0">
        {/* 상단 배경 */}
        <div 
          className="absolute top-0 left-0 w-full" 
          style={{ 
            height: '50%',
            backgroundColor: '#F8D6B3',
            opacity: 0.14
          }}
        ></div>
        
        {/* 하단 배경 */}
        <div 
          className="absolute bottom-0 left-0 w-full" 
          style={{ 
            height: '50%',
            backgroundColor: '#FFFFFF'
          }}
        ></div>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        {/* 헤더 */}
        <div className="flex items-center mb-8">
          <button 
            onClick={handleGoBack}
            className="text-2xl mr-4 hover:opacity-70 transition-opacity"
            style={{ color: '#8B4513' }}
          >
            ←
          </button>
          <div className="flex items-center gap-3">
            <img src={hedgehogImg} alt="참견도치" className="w-12 h-12 rounded-full" />
            <h1 className="text-3xl font-bold" style={{ color: '#8B4513' }}>5단계 해결 로드맵</h1>
          </div>
        </div>

        {/* 상단 메시지 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ 
            background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {conflictAnalysis ? '맞춤형' : '체계적인'} 갈등 해결을 위한 5단계 과정
          </h2>
          <p className="text-xl" style={{ color: '#666666' }}>
            {conflictAnalysis 
              ? 'AI가 분석한 당신의 갈등 상황에 맞는 단계별 해결 방법입니다' 
              : '각 단계를 차근차근 따라가며 갈등을 현명하게 해결해보세요'
            }
          </p>
          {conflictAnalysis && (
            <div className="mt-2 inline-block bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium">
              ✨ AI 분석 기반 맞춤 로드맵
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* 왼쪽: 단계 목록 */}
          <div className="w-1/3">
            <h3 className="text-2xl font-bold mb-6" style={{ color: '#333333' }}>단계별 가이드</h3>
            <div className="space-y-4">
              {steps.map((step) => (
                <div 
                  key={step.id}
                  className={`p-6 rounded-2xl cursor-pointer transition-all transform hover:-translate-y-1 shadow-lg ${
                    currentStep === step.id ? 'ring-4 ring-opacity-50' : ''
                  }`}
                  style={{ 
                    backgroundColor: currentStep === step.id ? step.color : '#FFFFFF',
                    color: currentStep === step.id ? '#FFFFFF' : '#333333',
                    ringColor: step.color
                  }}
                  onClick={() => handleStepClick(step.id)}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                      style={{ 
                        backgroundColor: currentStep === step.id ? 'rgba(255,255,255,0.2)' : step.color,
                        color: currentStep === step.id ? '#FFFFFF' : '#FFFFFF'
                      }}
                    >
                      {step.id}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{step.title}</h4>
                      <p className="text-sm opacity-90">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 선택된 단계 상세 내용 */}
          <div className="w-2/3">
            <div className="bg-white rounded-3xl p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl text-white"
                  style={{ backgroundColor: currentStepData.color }}
                >
                  {currentStepData.id}
                </div>
                <div>
                  <h3 className="text-3xl font-bold" style={{ color: '#333333' }}>
                    {currentStepData.title}
                  </h3>
                  <p className="text-lg" style={{ color: '#666666' }}>
                    {currentStepData.description}
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-lg leading-relaxed" style={{ color: '#333333' }}>
                  {currentStepData.content}
                </p>
              </div>

              {/* 단계별 가이드 내용 */}
              <div className="space-y-6">
                {/* 기간 표시 */}
                {currentStepData && currentStepData.period && (
                  <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full" 
                       style={{ backgroundColor: currentStepData.color + '20' }}>
                    <span className="text-sm font-bold" style={{ color: currentStepData.color }}>⏱️ 실행 기간:</span>
                    <span className="text-sm font-medium" style={{ color: currentStepData.color }}>{currentStepData.period}</span>
                  </div>
                )}
                
                <div className="border-l-4 pl-6" style={{ borderColor: currentStepData?.color || '#333' }}>
                  <h4 className="text-xl font-bold mb-3" style={{ color: '#333333' }}>
                    이 단계에서 해야 할 일
                  </h4>
                  <ul className="space-y-2 text-lg" style={{ color: '#666666' }}>
                    {currentStepData && currentStepData.actions && currentStepData.actions.length > 0 ? (
                      currentStepData.actions.map((action, idx) => (
                        <li key={idx}>• {action}</li>
                      ))
                    ) : (
                      <li className="text-gray-400 italic">• 이 단계에 대한 구체적인 액션이 아직 생성되지 않았습니다.</li>
                    )}
                  </ul>
                </div>

                {/* 네비게이션 버튼 */}
                <div className="flex justify-between pt-6">
                  <button
                    onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
                    disabled={currentStep === 1}
                    className="px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: currentStep === 1 ? '#E5E5E5' : '#696969',
                      color: '#FFFFFF'
                    }}
                  >
                    이전 단계
                  </button>
                  
                  <button
                    onClick={() => currentStep < 5 && setCurrentStep(currentStep + 1)}
                    disabled={currentStep === 5}
                    className="px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: currentStep === 5 ? '#E5E5E5' : currentStepData.color,
                      color: '#FFFFFF'
                    }}
                  >
                    다음 단계
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>


      </main>
    </div>
  );
};

export default RoadmapPage;