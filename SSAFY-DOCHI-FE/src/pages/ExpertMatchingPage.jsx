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
    // 브라우저 히스토리가 있으면 뒤로가기, 없으면 홈으로 이동
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
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
    alert(`${selectedExpert.name} 상담사 예약 - 서비스 준비중입니다! 🚧`);
    setShowBookingModal(false);
    setSelectedExpert(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative" style={{ zoom: '0.85' }}>
      {/* 전체 배경 컨테이너 */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-0 left-0 w-full" 
          style={{ 
            height: '100%',
            background: 'linear-gradient(to bottom, rgb(248, 214, 179), white)',
            opacity: 0.14
          }}
        ></div>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="max-w-5xl mx-auto px-3 py-10 relative z-10">
        {/* 헤더 */}
        <div className="flex flex-row items-center justify-between text-3xl font-bold mb-4 py-2 px-6" style={{ color: '#8B4513' }}>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleGoBack}
              className="text-2xl hover:opacity-70 transition-opacity"
              style={{ color: '#8B4513' }}
            >
              ←
            </button>
            <div>
              <h3 className="text-4xl font-bold" style={{ color: '#333333' }}>
                전문상담사 매칭
              </h3>
              <p className="text-base" style={{ color: '#666666' }}>
                각 분야별 전문 상담사가 여러분의 갈등 해결을 도와드립니다
              </p>
            </div>
          </div>
        </div>

        {/* 상담사 목록 */}
        <div className="bg-white">
          <div className="space-y-1">
            {experts.map((expert) => (
              <div 
                key={expert.id}
                className={`px-5 py-5 cursor-pointer transition-all duration-100 hover:bg-orange-50 ${
                  selectedExpert?.id === expert.id ? 'bg-orange-100' : ''
                }`}
                onClick={() => handleExpertSelect(expert)}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex gap-3 items-start flex-1 min-w-0">
                    <span
                      className="text-white text-xs px-2 py-1 rounded font-medium flex-shrink-0"
                      style={{ 
                        background: '#EE9278'
                      }}
                    >
                      {expert.specialty}
                    </span>
                    <h4
                      className="text-xl font-bold transition-colors flex-1 min-w-0 truncate leading-tight"
                      style={{ color: '#333333' }}
                    >
                      {expert.name} {expert.image}
                    </h4>
                    {selectedExpert?.id === expert.id && (
                      <span className="text-orange-600 font-bold text-sm">✓ 선택됨</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 text-sm flex-shrink-0" style={{ color: '#666666' }}>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-medium">{expert.rating}</span>
                    </div>
                    <span className="whitespace-nowrap font-bold text-lg" style={{ color: '#EE9278' }}>{expert.price}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4 text-sm" style={{ color: '#666666' }}>
                    <span>경력 {expert.experience}</span>
                    <span className="text-gray-400">•</span>
                    <span>{expert.description}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#666666' }}>
                    <span>상담 가능 시간:</span>
                    <div className="flex flex-wrap gap-1">
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
                </div>
              </div>
          ))}
          </div>
        </div>

        {/* 선택된 상담사 정보 및 예약 버튼 */}
        {selectedExpert && (
          <div className="bg-white p-5 mt-5">
            <h3 className="text-lg font-bold mb-3" style={{ color: '#8B4513' }}>
              💼 선택하신 상담사
            </h3>
            <div className="flex items-center justify-between p-3 rounded hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedExpert.image}</span>
                <div>
                  <h4 className="text-base font-bold" style={{ color: '#333333' }}>
                    {selectedExpert.name}
                  </h4>
                  <p className="text-sm" style={{ color: '#666666' }}>{selectedExpert.specialty}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold mb-2" style={{ color: '#EE9278' }}>
                  {selectedExpert.price}
                </div>
                <button
                  onClick={handleBooking}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-all font-medium text-sm"
                  style={{ backgroundColor: '#8B4513' }}
                >
                  상담 예약하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 서비스 안내 */}
        <div className="bg-white p-5 mt-5">
          <h4 className="font-bold text-lg mb-3" style={{ color: '#8B4513' }}>💡 상담 서비스 안내</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="text-2xl mb-2">📞</div>
              <h5 className="text-sm font-bold mb-1" style={{ color: '#333333' }}>
                1:1 화상 상담
              </h5>
              <p className="text-xs" style={{ color: '#666666' }}>
                편안한 공간에서 전문 상담사와 직접 대화
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl mb-2">🔒</div>
              <h5 className="text-sm font-bold mb-1" style={{ color: '#333333' }}>
                완전한 비밀보장
              </h5>
              <p className="text-xs" style={{ color: '#666666' }}>
                모든 상담 내용은 철저히 비밀 보장
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl mb-2">⏰</div>
              <h5 className="text-sm font-bold mb-1" style={{ color: '#333333' }}>
                유연한 시간 조정
              </h5>
              <p className="text-xs" style={{ color: '#666666' }}>
                일정에 맞춰 상담 시간 조정 가능
              </p>
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => navigate('/mypage')}
            className="flex-1 py-2 rounded-lg font-medium transition-all text-sm border"
            style={{
              backgroundColor: 'transparent',
              borderColor: '#8B4513',
              color: '#8B4513'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#8B4513';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#8B4513';
            }}
          >
            내 갈등 목록 보기
          </button>
          <button
            onClick={() => navigate('/conflicts/create')}
            className="flex-1 py-2 rounded-lg font-medium transition-all text-sm"
            style={{
              backgroundColor: '#8B4513',
              color: 'white',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#bf7d2c';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#8B4513';
            }}
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