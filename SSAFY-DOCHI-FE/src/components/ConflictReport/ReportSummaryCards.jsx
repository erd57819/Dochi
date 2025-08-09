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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">갈등 수준</h3>
          <img src={vector} alt="icon" className="w-5 h-5" />
        </div>
        <div className={`inline-block px-4 py-2 rounded-full font-bold ${getConflictLevelColor(summary.conflict_level)}`}>
          {summary.conflict_level || 'MEDIUM'}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">해결 가능성</h3>
          <img src={vector2} alt="icon" className="w-5 h-5" />
        </div>
        <div className="text-2xl font-bold text-[#bf7d2c]">
          {summary.resolution_feasibility || 'MEDIUM'}
        </div>
        <div className="text-sm text-gray-600 mt-2">
          성공 확률: {summary.success_probability || 70}%
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">전체 분위기</h3>
          <img src={todak} alt="icon" className="w-5 h-5" />
        </div>
        <div className="text-2xl font-bold text-gray-700">
          {emotionSummary.overall_mood === 'positive' ? '긍정적' : 
           emotionSummary.overall_mood === 'negative' ? '부정적' : '중립적'}
        </div>
        <div className="text-sm text-gray-600 mt-2">
          감정 변동성: {emotionSummary.emotion_volatility === 'high' ? '높음' : 
                      emotionSummary.emotion_volatility === 'medium' ? '중간' : '낮음'}
        </div>
      </div>
    </div>
  );
};

export default ReportSummaryCards;