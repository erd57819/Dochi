import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api.js';
import useAuthStore from '../stores/AuthStore.js';
import ProgressIndicator from '../components/conflict/ProgressIndicator';
import Step1ConflictType from '../components/conflict/Step1ConflictType';
import Step2ConflictDetail from '../components/conflict/Step2ConflictDetail';
import Step4EmotionState from '../components/conflict/Step4EmotionState';
import Step5AIAnalysis from '../components/conflict/Step5AIAnalysis';
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
    conflictFrequency: '',
    participants: '',
    desiredOutcome: '',
    priority: 'NONE',
    talkWillingness: 'NONE',
    initialEmotion: '',
    intensity: 5
  });

  const [isLoading, setIsLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiSolutions, setAiSolutions] = useState('');
  const [advancedAnalysis, setAdvancedAnalysis] = useState(null);
  const [tempConflictId, setTempConflictId] = useState(null);

  // 로그인 확인
  if (!isLoggedIn) {
    navigate('/login');
    return null;
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
        conflictWhen: isNaN(Number(formData.conflictWhen)) ? 0 : Number(formData.conflictWhen),
        conflictFrequency: isNaN(Number(formData.conflictFrequency)) ? 0 : Number(formData.conflictFrequency),
        intensity: parseInt(formData.intensity) || 0,
        participants: formData.participants && formData.participants.trim() !== ''
          ? formData.participants
          : '익명',
        desiredOutcome: formData.desiredOutcome || '미입력',
        priority: formData.priority || 'NONE',
        talkWillingness: formData.talkWillingness || 'NONE',
        initialEmotion: formData.initialEmotion || '무표정'
      };

      // sessionStorage에 데이터 저장
      sessionStorage.setItem('tempTitle', payload.title);
      sessionStorage.setItem('tempDescription', payload.description);
      sessionStorage.setItem('tempConflictType', payload.conflictType);

      console.log("보내는 데이터:", JSON.stringify(payload, null, 2));

      // 1단계: Redis에 임시 저장
      const tempResponse = await fetch(`${API_BASE_URL}/conflict/temp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload)
      });

      if (!tempResponse.ok) {
        throw new Error('갈등 데이터 임시 저장에 실패했습니다.');
      }

      const tempResult = await tempResponse.json();
      const conflictId = tempResult.data || tempResult.response?.response;
      setTempConflictId(conflictId);

      // 2단계: AI 분석 요청
      const analysisResponse = await fetch(`${API_BASE_URL}/conflict/analyze/${conflictId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!analysisResponse.ok) {
        throw new Error('AI 분석에 실패했습니다.');
      }

      const analysisResult = await analysisResponse.json();
      const analysisData = analysisResult.data || analysisResult.response?.response;

      setAiSummary(analysisData.summary || '요약을 생성할 수 없습니다.');
      setAiSolutions(analysisData.solutions || '해결방안을 생성할 수 없습니다.');

      // AI 분석 결과 sessionStorage에 저장
      sessionStorage.setItem('tempAiSummary', analysisData.summary || '요약을 생성할 수 없습니다.');
      sessionStorage.setItem('tempAiSolutions', analysisData.solutions || '해결방안을 생성할 수 없습니다.');

      // 고급 AI 분석 요청
      try {
        const advancedResponse = await fetch(`${API_BASE_URL}/conflict/analyze/advanced/${conflictId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        if (advancedResponse.ok) {
          const advancedResult = await advancedResponse.json();
          const advancedData = advancedResult.data || advancedResult.response?.response;
          setAdvancedAnalysis(advancedData);
        }
      } catch (error) {
        console.error('고급 AI 분석 오류:', error);
      }

      // AI 분석 완료 후 바로 리포트 페이지로 이동
      navigate(`/conflicts/analysis/${conflictId}`);

    } catch (error) {
      console.error('갈등 분석 오류:', error);
      alert(error.message || '갈등 분석 중 오류가 발생했습니다.');
      setCurrentStep(3); // 이전 단계로 돌아가기
    } finally {
      setIsLoading(false);
    }
  };


  // 최종 저장
  const handleFinalSave = async () => {
    if (!tempConflictId) {
      alert('임시 저장된 갈등 데이터가 없습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/conflict/analyze/advanced/save/${tempConflictId}`, {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* 갈등 목록으로 돌아가기 버튼 - 맨 위 */}
        <div className="mb-8">
          <span
            onClick={() => navigate('/conflicts')}
            className="text-gray-500 hover:text-gray-700 transition-colors text-sm cursor-pointer"
          >
            ← 갈등 목록으로 돌아가기
          </span>
        </div>
        
        {/* 헤더 */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            <span className="bg-[linear-gradient(108deg,rgba(191,125,44,1)_0%,rgba(139,69,19,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]">
              갈등 유형을 골라주세요
            </span>
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            갈등 상황을 단계별로 작성해주시면 AI가 분석해드릴게요
          </p>
          {/* Progress Indicator */}
          <ProgressIndicator currentStep={currentStep} totalSteps={4} />
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-3xl p-8 min-h-[700px] relative">
          {/* 고슴도치 이미지 - 왼쪽 하단 */}
          <div className="absolute bottom-6 left-6 z-0">
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

          {/* Step 4: AI 분석 */}
          {currentStep === 4 && (
            <Step5AIAnalysis
              formData={formData}
              aiSummary={aiSummary}
              aiSolutions={aiSolutions}
              advancedAnalysis={advancedAnalysis}
              isLoading={isLoading}
              onSave={handleFinalSave}
              onPrev={() => setCurrentStep(1)}
              tempConflictId={tempConflictId}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ConflictCreatePage;
