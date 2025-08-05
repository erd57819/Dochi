import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import hedgehogImg from '../assets/conflict.png';

const ExpertMatchingPage = () => {
  const navigate = useNavigate();
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const experts = [
    {
      id: 1,
      name: "김상담 박사",
      specialty: "부부·가족 갈등 전문",
      experience: "15년",
      rating: 4.9,
      price: "80,000원/회",
      description: "부부갈등과 가족 내 소통 문제 해결에 특화된 상담사입니다. 15년간 2000여 건의 상담 경험을 보유하고 있습니다.",
      availableTimes: ["월 14:00-16:00", "수 10:00-12:00", "금 16:00-18:00"],
      image: "👨‍⚕️"
    },
    {
      id: 2,
      name: "이해결 상담사",
      specialty: "직장 갈등 및 대인관계",
      experience: "10년",
      rating: 4.8,
      price: "70,000원/회",
      description: "직장 내 갈등, 상사·동료와의 관계 개선, 직무 스트레스 상담을 전문으로 합니다.",
      availableTimes: ["화 19:00-21:00", "목 14:00-16:00", "토 10:00-12:00"],
      image: "👩‍💼"
    },
    {
      id: 3,
      name: "박화해 교수",
      specialty: "청소년 갈등 및 교육",
      experience: "12년",
      rating: 4.9,
      price: "75,000원/회",
      description: "청소년 자녀와의 갈등, 교육 문제, 진로 상담 등 가족 내 세대 갈등 해결을 도와드립니다.",
      availableTimes: ["월 19:00-21:00", "수 16:00-18:00", "일 14:00-16:00"],
      image: "👨‍🏫"
    },
    {
      id: 4,
      name: "정소통 상담사",
      specialty: "친구·연인 관계",
      experience: "8년",
      rating: 4.7,
      price: "65,000원/회",
      description: "친구, 연인 관계에서 발생하는 갈등과 소통 문제 해결을 전문으로 하는 젊은 상담사입니다.",
      availableTimes: ["화 16:00-18:00", "금 19:00-21:00", "토 14:00-16:00"],
      image: "👩‍⚕️"
    }
  ];

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleExpertSelect = (expert) => {
    setSelectedExpert(expert);
  };

  const handleBooking = () => {
    if (selectedExpert) {
      setShowBookingModal(true);
    }
  };

  const handleConfirmBooking = () => {
    alert(`${selectedExpert.name} 상담사와의 상담이 예약되었습니다! 📅`);
    setShowBookingModal(false);
    setSelectedExpert(null);
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
            <h1 className="text-3xl font-bold" style={{ color: '#8B4513' }}>전문상담사 매칭</h1>
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
            전문 상담사와 함께 갈등을 해결해보세요
          </h2>
          <p className="text-xl" style={{ color: '#666666' }}>
            각 분야별 전문 상담사가 여러분의 갈등 해결을 도와드립니다
          </p>
        </div>

        {/* 상담사 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {experts.map((expert) => (
            <div 
              key={expert.id}
              className={`bg-white rounded-3xl p-8 cursor-pointer transition-all transform hover:-translate-y-2 shadow-xl relative overflow-hidden ${
                selectedExpert?.id === expert.id ? 'ring-4 ring-opacity-50' : ''
              }`}
              style={{
                ringColor: selectedExpert?.id === expert.id ? '#EE9278' : 'transparent'
              }}
              onClick={() => handleExpertSelect(expert)}
            >
              {/* 선택 표시 */}
              {selectedExpert?.id === expert.id && (
                <div 
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white text-lg"
                  style={{ backgroundColor: '#EE9278' }}
                >
                  ✓
                </div>
              )}

              <div className="flex items-start gap-6">
                {/* 프로필 이미지 */}
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                  style={{ backgroundColor: '#F8D6B3' }}
                >
                  {expert.image}
                </div>

                {/* 상담사 정보 */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold" style={{ color: '#333333' }}>
                      {expert.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-medium" style={{ color: '#666666' }}>
                        {expert.rating}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: '#EE9278', color: '#FFFFFF' }}
                    >
                      {expert.specialty}
                    </span>
                    <span className="ml-3 text-sm" style={{ color: '#666666' }}>
                      경력 {expert.experience}
                    </span>
                  </div>

                  <p className="text-sm mb-4 leading-relaxed" style={{ color: '#666666' }}>
                    {expert.description}
                  </p>

                  <div className="mb-4">
                    <h4 className="text-sm font-bold mb-2" style={{ color: '#333333' }}>
                      상담 가능 시간:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {expert.availableTimes.map((time, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: '#F8D6B3', color: '#8B4513' }}
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-bold" style={{ color: '#EE9278' }}>
                      {expert.price}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 선택된 상담사 정보 및 예약 버튼 */}
        {selectedExpert && (
          <div className="bg-white rounded-3xl p-8 shadow-xl mb-8">
            <h3 className="text-2xl font-bold mb-4" style={{ color: '#333333' }}>
              선택하신 상담사
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                  style={{ backgroundColor: '#F8D6B3' }}
                >
                  {selectedExpert.image}
                </div>
                <div>
                  <h4 className="text-xl font-bold" style={{ color: '#333333' }}>
                    {selectedExpert.name}
                  </h4>
                  <p style={{ color: '#666666' }}>{selectedExpert.specialty}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold mb-2" style={{ color: '#EE9278' }}>
                  {selectedExpert.price}
                </div>
                <button
                  onClick={handleBooking}
                  className="px-8 py-3 text-white rounded-xl hover:opacity-90 transition-all transform hover:-translate-y-1 shadow-lg font-medium"
                  style={{ backgroundColor: '#EE9278' }}
                >
                  상담 예약하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 서비스 안내 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">📞</div>
            <h4 className="text-xl font-bold mb-2" style={{ color: '#333333' }}>
              1:1 화상 상담
            </h4>
            <p style={{ color: '#666666' }}>
              편안한 공간에서 전문 상담사와 직접 대화하세요
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🔒</div>
            <h4 className="text-xl font-bold mb-2" style={{ color: '#333333' }}>
              완전한 비밀보장
            </h4>
            <p style={{ color: '#666666' }}>
              모든 상담 내용은 철저히 비밀이 보장됩니다
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">⏰</div>
            <h4 className="text-xl font-bold mb-2" style={{ color: '#333333' }}>
              유연한 시간 조정
            </h4>
            <p style={{ color: '#666666' }}>
              여러분의 일정에 맞춰 상담 시간을 조정할 수 있습니다
            </p>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="text-center">
          <button
            onClick={() => navigate('/conflicts')}
            className="px-8 py-4 text-white rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 shadow-lg font-medium text-lg mr-4"
            style={{ background: '#696969' }}
          >
            내 갈등 목록 보기
          </button>
          <button
            onClick={() => navigate('/conflicts/create')}
            className="px-8 py-4 text-white rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 shadow-lg font-medium text-lg"
            style={{ background: '#8B4513' }}
          >
            새 갈등 상황 분석하기
          </button>
        </div>
      </main>

      {/* 예약 확인 모달 */}
      {showBookingModal && selectedExpert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: '#333333' }}>
              상담 예약 확인
            </h3>
            
            <div className="text-center mb-6">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4"
                style={{ backgroundColor: '#F8D6B3' }}
              >
                {selectedExpert.image}
              </div>
              <h4 className="text-xl font-bold" style={{ color: '#333333' }}>
                {selectedExpert.name}
              </h4>
              <p style={{ color: '#666666' }}>{selectedExpert.specialty}</p>
              <div className="text-2xl font-bold mt-2" style={{ color: '#EE9278' }}>
                {selectedExpert.price}
              </div>
            </div>

            <div className="mb-6">
              <h5 className="font-bold mb-2" style={{ color: '#333333' }}>
                상담 가능 시간:
              </h5>
              <div className="space-y-2">
                {selectedExpert.availableTimes.map((time, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: '#F8D6B3', color: '#8B4513' }}
                  >
                    {time}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-3 rounded-xl font-medium"
                style={{ backgroundColor: '#E5E5E5', color: '#666666' }}
              >
                취소
              </button>
              <button
                onClick={handleConfirmBooking}
                className="flex-1 px-4 py-3 text-white rounded-xl font-medium"
                style={{ backgroundColor: '#EE9278' }}
              >
                예약 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertMatchingPage;