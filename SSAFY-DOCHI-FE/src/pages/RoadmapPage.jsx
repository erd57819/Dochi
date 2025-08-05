import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import hedgehogImg from '../assets/conflict.png';

const RoadmapPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "갈등 상황 인식",
      description: "현재 갈등 상황을 명확히 파악하고 정리해보세요",
      content: "갈등의 원인, 관련된 사람들, 그리고 현재 상황을 객관적으로 분석해보는 단계입니다.",
      color: "#83673f"
    },
    {
      id: 2,
      title: "감정 정리하기",
      description: "자신과 상대방의 감정을 이해하고 정리해보세요",
      content: "갈등 상황에서 느끼는 감정들을 인정하고, 상대방의 입장에서도 생각해보는 시간을 가져보세요.",
      color: "#cd9f6e"
    },
    {
      id: 3,
      title: "대화 준비하기",
      description: "건설적인 대화를 위한 준비를 해보세요",
      content: "무엇을 말할지, 어떤 방식으로 대화할지 미리 계획을 세워보는 단계입니다.",
      color: "#f8d6b3"
    },
    {
      id: 4,
      title: "대화 실행하기",
      description: "준비된 내용을 바탕으로 실제 대화를 진행해보세요",
      content: "서로의 이야기를 듣고, 공감하며, 해결방안을 함께 찾아가는 단계입니다.",
      color: "#EE9278"
    },
    {
      id: 5,
      title: "관계 회복하기",
      description: "갈등 해결 후 관계를 더욱 발전시켜 나가세요",
      content: "갈등을 통해 배운 점들을 바탕으로 더 나은 관계를 만들어가는 단계입니다.",
      color: "#7F5539"
    }
  ];

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleStepClick = (stepId) => {
    setCurrentStep(stepId);
  };

  const currentStepData = steps.find(step => step.id === currentStep);

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
            갈등 해결을 위한 체계적인 5단계 과정
          </h2>
          <p className="text-xl" style={{ color: '#666666' }}>
            각 단계를 차근차근 따라가며 갈등을 현명하게 해결해보세요
          </p>
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
                <div className="border-l-4 pl-6" style={{ borderColor: currentStepData.color }}>
                  <h4 className="text-xl font-bold mb-3" style={{ color: '#333333' }}>
                    이 단계에서 해야 할 일
                  </h4>
                  <ul className="space-y-2 text-lg" style={{ color: '#666666' }}>
                    {currentStep === 1 && (
                      <>
                        <li>• 갈등이 언제부터 시작되었는지 파악하기</li>
                        <li>• 갈등의 핵심 원인 찾아보기</li>
                        <li>• 관련된 모든 사람들의 입장 정리하기</li>
                      </>
                    )}
                    {currentStep === 2 && (
                      <>
                        <li>• 내가 느끼는 감정을 솔직하게 인정하기</li>
                        <li>• 상대방이 느낄 수 있는 감정 생각해보기</li>
                        <li>• 감정에 휩쓸리지 않고 객관적으로 바라보기</li>
                      </>
                    )}
                    {currentStep === 3 && (
                      <>
                        <li>• 대화의 목표 명확히 하기</li>
                        <li>• 말하고 싶은 내용 정리하기</li>
                        <li>• 상대방의 이야기를 들을 준비하기</li>
                      </>
                    )}
                    {currentStep === 4 && (
                      <>
                        <li>• 차분하고 존중하는 태도로 대화하기</li>
                        <li>• 서로의 입장을 충분히 듣기</li>
                        <li>• 함께 해결방안 찾아보기</li>
                      </>
                    )}
                    {currentStep === 5 && (
                      <>
                        <li>• 해결된 내용을 서로 확인하기</li>
                        <li>• 앞으로의 관계 개선 방안 논의하기</li>
                        <li>• 갈등 경험을 통한 성장 인정하기</li>
                      </>
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

        {/* 하단 액션 버튼 */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/conflicts/create')}
            className="px-8 py-4 text-white rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 shadow-lg font-medium text-lg"
            style={{ background: '#8B4513' }}
          >
            내 갈등 상황 분석해보기
          </button>
        </div>
      </main>
    </div>
  );
};

export default RoadmapPage;