import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api.js';
import useAuthStore from '../stores/AuthStore.js';
import ProgressIndicator from '../components/conflict/ProgressIndicator';
import Step1ConflictType from '../components/conflict/Step1ConflictType';
import Step2ConflictDetail from '../components/conflict/Step2ConflictDetail';
import Step4EmotionState from '../components/conflict/Step4EmotionState';
import hedgehogImg from '../assets/conflict.png';

const ConflictCreatePage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    conflictType: '',
    conflictWhen: '',
    conflictFrequency: 1,
    participants: '',
    desiredOutcome: [],
    priority: 'NONE',
    talkWillingness: 'NONE',
    initialEmotion: [],
    intensity: 5
  });

  const [isLoading, setIsLoading] = useState(false);
  const [tempConflictId, setTempConflictId] = useState(null);

  // 비로그인 시 접근 차단
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">로그인 페이지로 이동 중...</div>
      </div>
    );
  }

  const handleFormChange = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      handleAnalyzeConflict();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // AI 분석 요청
  const handleAnalyzeConflict = async () => {
    setIsLoading(true);
    setCurrentStep(4);

    try {
      const payload = {
        title: formData.title || '제목 없음',
        description: formData.description || '설명 없음',
        conflictType: formData.conflictType || 'ETC',
        conflictWhen: Number(formData.conflictWhen) || 1,
        conflictFrequency: Number(formData.conflictFrequency) || 1,
        intensity: Number(formData.intensity) || 5,
        participants: formData.participants && formData.participants.trim() !== ''
          ? formData.participants
          : null,
        desiredOutcome: Array.isArray(formData.desiredOutcome) && formData.desiredOutcome.length > 0 
          ? formData.desiredOutcome.join(',')
          : 'NONE',
        priority: formData.priority || 'NONE',
        talkWillingness: formData.talkWillingness || 'NONE',
        initialEmotion: Array.isArray(formData.initialEmotion) && formData.initialEmotion.length > 0 
          ? formData.initialEmotion.join(',')
          : 'ETC'
      };

      // sessionStorage에 데이터 저장
      sessionStorage.setItem('tempTitle', payload.title);
      sessionStorage.setItem('tempDescription', payload.description);
      sessionStorage.setItem('tempConflictType', payload.conflictType);
      sessionStorage.setItem('tempIntensity', payload.intensity);
      sessionStorage.setItem('tempEmotion', payload.initialEmotion);
      sessionStorage.setItem('tempPriority', payload.priority);
      sessionStorage.setItem('tempTalkWillingness', payload.talkWillingness);
      sessionStorage.setItem('tempDesiredOutcome', payload.desiredOutcome);

      console.log("📤 갈등 생성 데이터:", JSON.stringify(payload, null, 2));

      // 1단계: Redis에 임시 저장
      const tempResponse = await fetch(`${API_BASE_URL}/conflict/temp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload)
      });

      console.log('Temp Response Status:', tempResponse.status);
      const tempResponseText = await tempResponse.text();
      console.log('Temp Response Body:', tempResponseText);

      if (!tempResponse.ok) {
        throw new Error(`갈등 데이터 임시 저장 실패: ${tempResponse.status} - ${tempResponseText}`);
      }

      const tempResult = JSON.parse(tempResponseText);
      const conflictId = tempResult.data || tempResult.response?.response || tempResult.id;
      setTempConflictId(conflictId);

      console.log('Generated Conflict ID:', conflictId);

      // 2단계: 고급 AI 분석 요청 (재시도 로직 포함)
      let advancedRetryCount = 0;
      const maxAdvancedRetries = 2; // AI 분석 재시도 횟수 증가
      
      let analysisData = null;
      
      while (advancedRetryCount <= maxAdvancedRetries && !analysisData) {
        try {
          const advancedController = new AbortController();
          const advancedTimeoutId = setTimeout(() => advancedController.abort(), 30000); // 30초 타임아웃
          
          console.log(`AI 분석 시도 ${advancedRetryCount + 1}/${maxAdvancedRetries + 1}...`);
          
          const advancedResponse = await fetch(`${API_BASE_URL}/conflict/analyze/advanced/${conflictId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            signal: advancedController.signal
          });
          
          clearTimeout(advancedTimeoutId);
          console.log('AI Analysis Response Status:', advancedResponse.status);

          if (advancedResponse.ok) {
            try {
              const analysisResult = await advancedResponse.json();
              console.log('✅ AI 분석 완료:', analysisResult);
              analysisData = analysisResult.data || analysisResult.response?.response || analysisResult;
              
              // AI 분석 결과 sessionStorage에 저장
              const aiSummary = analysisData.summary || analysisData.conflict_analysis || '분석을 생성할 수 없습니다.';
              const aiSolutions = analysisData.solutions || analysisData.recommended_actions || '해결방안을 생성할 수 없습니다.';
              
              sessionStorage.setItem('tempAiSummary', aiSummary);
              sessionStorage.setItem('tempAiSolutions', aiSolutions);
              break;
            } catch (jsonError) {
              console.log(`⚠️ AI 분석 JSON 파싱 실패 (시도 ${advancedRetryCount + 1}):`, jsonError);
              advancedRetryCount++;
              if (advancedRetryCount <= maxAdvancedRetries) {
                console.log('3초 후 재시도...');
                await new Promise(resolve => setTimeout(resolve, 3000));
              }
            }
          } else if (advancedResponse.status === 504) {
            console.log(`⏰ AI 분석 504 타임아웃 (시도 ${advancedRetryCount + 1})`);
            advancedRetryCount++;
            if (advancedRetryCount <= maxAdvancedRetries) {
              console.log('3초 후 재시도...');
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          } else {
            const analysisError = await advancedResponse.text();
            console.log('AI Analysis Error:', analysisError);
            throw new Error(`AI 분석 실패: ${advancedResponse.status}`);
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log(`⏰ AI 분석 타임아웃 (시도 ${advancedRetryCount + 1})`);
            advancedRetryCount++;
            if (advancedRetryCount <= maxAdvancedRetries) {
              console.log('3초 후 재시도...');
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          } else {
            throw error;
          }
        }
      }
      
      // 모든 재시도 실패 시 기본값 설정
      if (!analysisData) {
        console.log('⚠️ AI 분석 모든 시도 실패 - 기본값 사용');
        sessionStorage.setItem('tempAiSummary', '서버 응답 지연으로 인해 분석을 완료할 수 없습니다. 잠시 후 다시 시도해주세요.');
        sessionStorage.setItem('tempAiSolutions', '서버 응답 지연으로 인해 해결방안을 생성할 수 없습니다. 갈등 상세 페이지에서 다시 확인해주세요.');
      }

      // AI 분석 완료 후 ConflictDetailPage로 이동
      navigate(`/conflicts/${conflictId}`);

    } catch (error) {
      console.error('갈등 분석 오류:', error);
      alert(error.message || '갈등 분석 중 오류가 발생했습니다.');
      setCurrentStep(3); // 이전 단계로 돌아가기
    } finally {
      setIsLoading(false);
    }
  };



  // 단계별 제목과 설명 설정
  const getStepInfo = (step) => {
    switch (step) {
      case 1:
        return {
          title: "갈등 유형을 골라주세요",
          description: "어떤 갈등을 겪고 계신지 선택해주세요"
        };
      case 2:
        return {
          title: "갈등 상황 설명하기",
          description: "어떤 사람과 갈등이 있었는지 작성해주세요"
        };
      case 3:
        return {
          title: "내가 원하는 해결 결과",
          description: "갈등이 어떻게 해결되기를 원하는지 알려주세요"
        };
      case 4:
        return {
          title: "AI 분석 중",
          description: "갈등 상황을 분석하고 맞춤형 해결방안을 생성하고 있습니다"
        };
      default:
        return {
          title: "갈등 유형을 골라주세요",
          description: "갈등 상황을 단계별로 작성해주시면 AI가 분석해드릴게요"
        };
    }
  };

  const stepInfo = getStepInfo(currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50" style={{ zoom: '0.75' }}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* 상단 네비게이션 및 제목 */}
        <div className="relative mb-8">
          <div className="absolute left-0 top-0">
            <span
              onClick={() => navigate('/mypage')}
              className="text-gray-500 hover:text-gray-700 transition-colors text-sm cursor-pointer"
            >
              ← 갈등 목록으로 돌아가기
            </span>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-1">
              <span className="bg-[linear-gradient(108deg,rgba(191,125,44,1)_0%,rgba(139,69,19,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">
                {stepInfo.title}
              </span>
            </h1>
            <p className="text-sm text-gray-600">
              {stepInfo.description}
            </p>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="text-center mb-6">
          <ProgressIndicator currentStep={currentStep} totalSteps={4} />
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-3xl p-8 pt-4 min-h-[700px] relative" style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
          {/* 고슴도치 이미지 - 왼쪽 하단 */}
          <div className="absolute bottom-6 left-6" style={{ zIndex: -1 }}>
            <img src={hedgehogImg} alt="고슴도치" className="w-48 h-48 object-contain opacity-80" />
          </div>
          {/* Step 1: 갈등 유형 */}
          {currentStep === 1 && (
            <Step1ConflictType
              formData={formData}
              onChange={handleFormChange}
              onNext={handleNextStep}
            />
          )}

          {/* Step 2: 갈등 상세 + 발생 시기 */}
          {currentStep === 2 && (
            <Step2ConflictDetail
              formData={formData}
              onChange={handleFormChange}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          )}

          {/* Step 3: 감정 상태 */}
          {currentStep === 3 && (
            <Step4EmotionState
              formData={formData}
              onChange={handleFormChange}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              isLoading={isLoading}
            />
          )}

          {/* Step 4: AI 분석 로딩 화면 */}
          {currentStep === 4 && (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
              {/* 고슴도치 챗바퀴 애니메이션 */}
              <div className="relative mb-8">
                {/* 외부 챗바퀴 (회전하는 원) */}
                <div className="w-32 h-32 border-8 border-orange-200 border-t-orange-500 rounded-full animate-spin" 
                     style={{ animationDuration: '1.5s' }}></div>
                
                {/* 내부 챗바퀴 (역방향 회전) */}
                <div className="absolute inset-2 w-24 h-24 border-4 border-orange-100 border-b-orange-400 rounded-full animate-spin" 
                     style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
                
                {/* 고슴도치 이미지 (중앙에 고정) */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img 
                    src={hedgehogImg} 
                    alt="도치" 
                    className="w-16 h-16 object-contain animate-pulse" 
                    style={{ animationDuration: '2s' }}
                  />
                </div>
              </div>
              
              {/* 로딩 메시지 */}
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                <span className="bg-[linear-gradient(108deg,rgba(191,125,44,1)_0%,rgba(139,69,19,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">
                  AI가 갈등을 분석하고 있어요
                </span>
              </h3>
              
              <p className="text-gray-600 mb-2">잠시만 기다려주세요...</p>
              <p className="text-sm text-gray-500">
                🔍 갈등 상황 파악 중<br/>
                🧠 해결방안 생성 중<br/>
                📊 관계 분석 중
              </p>
              
              {/* 진행 상황 표시 점들 */}
              <div className="flex space-x-2 mt-6">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConflictCreatePage;
