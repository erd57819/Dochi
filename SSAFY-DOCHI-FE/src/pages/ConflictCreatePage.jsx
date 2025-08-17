import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api.js';
import useAuthStore from '../stores/AuthStore.js';
import ProgressIndicator from '../components/conflict/ProgressIndicator';
import Step1ConflictType from '../components/conflict/Step1ConflictType';
import Step2ConflictDetail from '../components/conflict/Step2ConflictDetail';
import Step4EmotionState from '../components/conflict/Step4EmotionState';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
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

      // MySQL에 직접 저장 (AI 분석은 백엔드에서 처리)
      const createResponse = await fetch(`${API_BASE_URL}/conflict/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload)
      });

      console.log('Create Response Status:', createResponse.status);
      const createResponseText = await createResponse.text();
      console.log('Create Response Body:', createResponseText);

      if (!createResponse.ok) {
        throw new Error(`갈등 데이터 저장 실패: ${createResponse.status} - ${createResponseText}`);
      }

      const createResult = JSON.parse(createResponseText);
      console.log('=== 서버 응답 전체 구조 ===', createResult);
      
      // 실제 conflictId 추출
      const conflictId = createResult.data?.id || createResult.data?.conflictId;
      
      if (!conflictId) {
        throw new Error('서버에서 갈등 ID를 반환하지 않았습니다.');
      }
      
      console.log('✅ 갈등 저장 완료, conflictId:', conflictId);
      setTempConflictId(conflictId);

      // 갈등 상세 페이지로 이동
      console.log('🔄 갈등 상세 페이지로 이동:', conflictId);
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
              {/* 로딩 스피너 */}
              <div className="mb-8">
                <LoadingSpinner type="gif" size="xlarge" />
              </div>
              
              {/* 로딩 메시지 */}
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                <span className="bg-[linear-gradient(108deg,rgba(191,125,44,1)_0%,rgba(139,69,19,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">
                  참견도치가 갈등을 분석하고 있어요
                </span>
              </h3>
                            
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConflictCreatePage;
