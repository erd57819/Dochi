import React from 'react';

const ActionPlanTab = ({ actionPlans }) => {
  // 백엔드에서 받은 데이터 확인
  console.log('ActionPlanTab received:', actionPlans);

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-light text-gray-800 mb-2">맞춤형 액션 플랜</h2>
        <div className="w-16 h-0.5 bg-amber-600 mx-auto"></div>
      </div>
      
      {/* 우선순위별 행동계획 */}
      {actionPlans?.priority_actions && actionPlans.priority_actions.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-8 border-l-4 border-amber-500">
          <h3 className="text-xl font-semibold text-amber-800 mb-6 flex items-center">
            <span className="mr-3">🎯</span>우선순위별 행동계획
          </h3>
          <div className="space-y-4">
            {actionPlans.priority_actions.map((action, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border-l-2 border-amber-300">
                <div className="flex items-start">
                  <span className="bg-amber-100 text-amber-800 text-sm font-semibold px-3 py-1 rounded-full mr-4">
                    {idx + 1}
                  </span>
                  <p className="text-gray-700 flex-1">{action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 소통 개선 팁 */}
      {actionPlans?.communication_tips && actionPlans.communication_tips.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 border-l-4 border-blue-500">
          <h3 className="text-xl font-semibold text-blue-800 mb-6 flex items-center">
            <span className="mr-3">💬</span>소통 개선 팁
          </h3>
          <div className="space-y-4">
            {actionPlans.communication_tips.map((tip, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border-l-2 border-blue-300">
                <div className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full mr-4">
                    {idx + 1}
                  </span>
                  <p className="text-gray-700 flex-1">{tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 장기적 제안 */}
      {actionPlans?.long_term_suggestions && actionPlans.long_term_suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8 border-l-4 border-green-500">
          <h3 className="text-xl font-semibold text-green-800 mb-6 flex items-center">
            <span className="mr-3">🌱</span>장기적 제안
          </h3>
          <div className="space-y-4">
            {actionPlans.long_term_suggestions.map((suggestion, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border-l-2 border-green-300">
                <div className="flex items-start">
                  <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full mr-4">
                    {idx + 1}
                  </span>
                  <p className="text-gray-700 flex-1">{suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 데이터가 없을 때 표시 */}
      {(!actionPlans?.priority_actions || actionPlans.priority_actions.length === 0) &&
       (!actionPlans?.communication_tips || actionPlans.communication_tips.length === 0) &&
       (!actionPlans?.long_term_suggestions || actionPlans.long_term_suggestions.length === 0) && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💭</div>
          <p className="text-gray-500 text-lg">액션 플랜 데이터가 생성되지 않았습니다.</p>
          <p className="text-gray-400 text-sm mt-2">대화 내용을 바탕으로 액션 플랜을 분석 중입니다...</p>
        </div>
      )}
    </div>
  );
};

export default ActionPlanTab;