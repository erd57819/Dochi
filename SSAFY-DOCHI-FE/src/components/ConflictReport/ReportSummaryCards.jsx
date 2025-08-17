import React from 'react';
import vector from "@/assets/Vector.png";
import vector2 from "@/assets/Vector-2.png";
import todak from "@/assets/todak.png";

const ReportSummaryCards = ({ summary, emotionSummary }) => {
  const getConflictLevelColor = (level) => {
    switch (level) {
      case 'HIGH':
        return 'text-red-600 bg-red-50';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50';
      case 'LOW':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="relative mb-8">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 -m-4" 
        style={{ 
          backgroundColor: '#F8D6B3',
          opacity: 0.14,
          zIndex: -1,
          borderRadius: '1rem'
        }}
      ></div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div 
          className="bg-white rounded-xl p-6 border-2"
          style={{ 
            borderColor: '#BF7D2C',
            boxShadow: '0 10px 25px rgba(191, 125, 44, 0.1)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="text-lg font-semibold"
              style={{ color: '#333333' }}
            >
              갈등 수준
            </h3>
            <img src={vector} alt="icon" className="w-5 h-5" />
          </div>
          <div className={`inline-block px-4 py-2 rounded-full font-bold ${getConflictLevelColor(summary.conflict_level)}`}>
            {summary.conflict_level || '데이터 없음'}
          </div>
        </div>

        <div 
          className="bg-white rounded-xl p-6 border-2"
          style={{ 
            borderColor: '#BF7D2C',
            boxShadow: '0 10px 25px rgba(191, 125, 44, 0.1)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="text-lg font-semibold"
              style={{ color: '#333333' }}
            >
              해결 가능성
            </h3>
            <img src={vector2} alt="icon" className="w-5 h-5" />
          </div>
          <div 
            className="text-2xl font-bold"
            style={{
              background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {summary.resolution_feasibility || '데이터 없음'}
          </div>
          <div className="text-sm mt-2" style={{ color: '#6B7280' }}>
            성공 확률: {summary.success_probability ? `${summary.success_probability}%` : '데이터 없음'}
          </div>
        </div>

        <div 
          className="bg-white rounded-xl p-6 border-2"
          style={{ 
            borderColor: '#BF7D2C',
            boxShadow: '0 10px 25px rgba(191, 125, 44, 0.1)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="text-lg font-semibold"
              style={{ color: '#333333' }}
            >
              전체 분위기
            </h3>
            <img src={todak} alt="icon" className="w-5 h-5" />
          </div>
          <div 
            className="text-2xl font-bold"
            style={{ color: '#333333' }}
          >
            {emotionSummary.overall_mood === 'positive' ? '긍정적' : 
             emotionSummary.overall_mood === 'negative' ? '부정적' : '중립적'}
          </div>
          <div className="text-sm mt-2" style={{ color: '#6B7280' }}>
            감정 변동성: {emotionSummary.emotion_volatility === 'high' ? '높음' : 
                        emotionSummary.emotion_volatility === 'medium' ? '중간' : '낮음'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportSummaryCards;