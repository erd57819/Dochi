import React from 'react';

const ActionPlanTab = ({ actionPlans }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">맞춤형 액션 플랜</h2>
      
      {/* 우선순위 액션 */}
      {actionPlans.priority_actions && actionPlans.priority_actions.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-4">🎯 우선순위 액션</h3>
          <div className="space-y-3">
            {actionPlans.priority_actions.map((action, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{action.speaker}</p>
                    <p className="text-gray-700 mt-1">{action.action}</p>
                    <p className="text-sm text-gray-600 mt-2">목적: {action.purpose}</p>
                  </div>
                  <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">
                    긴급도: {action.urgency}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 화자별 상세 플랜 */}
      {actionPlans.individual_plans && Object.keys(actionPlans.individual_plans).length > 0 && (
        <div className="space-y-6">
          {Object.entries(actionPlans.individual_plans).map(([speaker, plan]) => (
            <div key={speaker} className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[#7f5539] mb-4">{speaker}님을 위한 액션 플랜</h3>
              
              <div className="mb-4">
                <p className="text-gray-700">{plan.situation_analysis}</p>
              </div>

              {/* 즉시 실행 항목 */}
              {plan.immediate_actions && plan.immediate_actions.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-green-800 mb-2">즉시 실행</h4>
                  {plan.immediate_actions.map((action, idx) => (
                    <div key={idx} className="mb-3">
                      <p className="font-medium text-gray-800">{action.action}</p>
                      {action.example && (
                        <p className="text-sm text-gray-600 mt-1 italic">"{action.example}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 의사소통 전략 */}
              {plan.communication_strategies && plan.communication_strategies.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2">의사소통 전략</h4>
                  {plan.communication_strategies.map((strategy, idx) => (
                    <div key={idx} className="mb-2">
                      <p className="text-sm font-medium text-gray-800">{strategy.strategy}</p>
                      {strategy.sample_phrase && (
                        <p className="text-sm text-gray-600 mt-1">예시: "{strategy.sample_phrase}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 자기 성찰 질문 */}
              {plan.self_reflection_questions && plan.self_reflection_questions.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">스스로에게 묻기</h4>
                  <ul className="space-y-1">
                    {plan.self_reflection_questions.map((question, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {question}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 공통 권장사항 */}
      {actionPlans.collective_recommendations && actionPlans.collective_recommendations.length > 0 && (
        <div className="bg-[#f8d6b3] bg-opacity-30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#7f5539] mb-3">모두를 위한 권장사항</h3>
          <ul className="space-y-2">
            {actionPlans.collective_recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-[#bf7d2c] mr-2">✓</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ActionPlanTab;