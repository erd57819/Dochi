import React from 'react';

const ActionPlanTab = ({ actionPlans }) => {
  // 백엔드에서 받은 데이터 확인
  console.log('ActionPlanTab received:', actionPlans);

  return (
    <div className="relative">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 -m-6" 
        style={{ 
          backgroundColor: '#F8D6B3',
          opacity: 0.14,
          zIndex: -1,
          borderRadius: '1rem'
        }}
      ></div>
      
      <div className="space-y-8 relative z-10">
        <div className="text-center mb-8">
          <h2 
            className="text-3xl font-light mb-2"
            style={{
              background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            맞춤형 액션 플랜
          </h2>
          <div 
            className="w-16 h-0.5 mx-auto"
            style={{ backgroundColor: '#BF7D2C' }}
          ></div>
        </div>
      
      {/* 우선순위별 행동계획 */}
      {actionPlans?.priority_actions && actionPlans.priority_actions.length > 0 && (
        <div 
          className="rounded-lg p-8 border-l-4"
          style={{
            background: 'linear-gradient(135deg, #F8D6B3, #FFE4CC)',
            borderColor: '#BF7D2C',
            boxShadow: '0 4px 6px rgba(191, 125, 44, 0.1)'
          }}
        >
          <h3 
            className="text-xl font-semibold mb-6 flex items-center"
            style={{ color: '#8B4513' }}
          >
            <span className="mr-3">🎯</span>우선순위별 행동계획
          </h3>
          <div className="space-y-4">
            {actionPlans.priority_actions.map((action, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-lg p-4 border-l-2"
                style={{ 
                  borderColor: '#BF7D2C',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="flex items-start">
                  <span 
                    className="text-sm font-semibold px-3 py-1 rounded-full mr-4"
                    style={{ 
                      backgroundColor: 'rgba(248, 214, 179, 0.5)',
                      color: '#8B4513'
                    }}
                  >
                    {idx + 1}
                  </span>
                  <p style={{ color: '#333333' }} className="flex-1">{action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 소통 개선 팁 */}
      {actionPlans?.communication_tips && actionPlans.communication_tips.length > 0 && (
        <div 
          className="rounded-lg p-8 border-l-4"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: '#3B82F6',
            boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)'
          }}
        >
          <h3 
            className="text-xl font-semibold mb-6 flex items-center"
            style={{ color: '#1E40AF' }}
          >
            <span className="mr-3">💬</span>소통 개선 팁
          </h3>
          <div className="space-y-4">
            {actionPlans.communication_tips.map((tip, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-lg p-4 border-l-2"
                style={{ 
                  borderColor: '#3B82F6',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="flex items-start">
                  <span 
                    className="text-sm font-semibold px-3 py-1 rounded-full mr-4"
                    style={{ 
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#1E40AF'
                    }}
                  >
                    {idx + 1}
                  </span>
                  <p style={{ color: '#333333' }} className="flex-1">{tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 장기적 제안 */}
      {actionPlans?.long_term_suggestions && actionPlans.long_term_suggestions.length > 0 && (
        <div 
          className="rounded-lg p-8 border-l-4"
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderColor: '#22C55E',
            boxShadow: '0 4px 6px rgba(34, 197, 94, 0.1)'
          }}
        >
          <h3 
            className="text-xl font-semibold mb-6 flex items-center"
            style={{ color: '#15803D' }}
          >
            <span className="mr-3">🌱</span>장기적 제안
          </h3>
          <div className="space-y-4">
            {actionPlans.long_term_suggestions.map((suggestion, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-lg p-4 border-l-2"
                style={{ 
                  borderColor: '#22C55E',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="flex items-start">
                  <span 
                    className="text-sm font-semibold px-3 py-1 rounded-full mr-4"
                    style={{ 
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      color: '#15803D'
                    }}
                  >
                    {idx + 1}
                  </span>
                  <p style={{ color: '#333333' }} className="flex-1">{suggestion}</p>
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
          <p 
            className="text-lg"
            style={{ color: '#6B7280' }}
          >
            액션 플랜 데이터가 생성되지 않았습니다.
          </p>
          <p 
            className="text-sm mt-2"
            style={{ color: '#9CA3AF' }}
          >
            대화 내용을 바탕으로 액션 플랜을 분석 중입니다...
          </p>
        </div>
      )}
      </div>
    </div>
  );
};

export default ActionPlanTab;