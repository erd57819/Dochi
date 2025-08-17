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
          className="rounded-lg p-8"
          style={{
            background: 'linear-gradient(135deg, #F8D6B3, #FFE4CC)'
          }}
        >
          <h3 
            className="text-xl font-semibold mb-6 flex items-center"
            style={{ color: '#8B4513' }}
          >
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
            우선순위별 행동계획
          </h3>
          <div className="space-y-4">
            {actionPlans.priority_actions.map((action, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-lg p-4"
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
          className="rounded-lg p-8"
          style={{
            background: 'linear-gradient(135deg, #F5F1EC, #F8F5F0)'
          }}
        >
          <h3 
            className="text-xl font-semibold mb-6 flex items-center"
            style={{ color: '#654321' }}
          >
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            소통 개선 팁
          </h3>
          <div className="space-y-4">
            {actionPlans.communication_tips.map((tip, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-lg p-4"
              >
                <div className="flex items-start">
                  <span 
                    className="text-sm font-semibold px-3 py-1 rounded-full mr-4"
                    style={{ 
                      backgroundColor: 'rgba(160, 116, 60, 0.1)',
                      color: '#8B4513'
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
          className="rounded-lg p-8"
          style={{
            background: 'linear-gradient(135deg, #C6A876, #D9C499)'
          }}
        >
          <h3 
            className="text-xl font-semibold mb-6 flex items-center"
            style={{ color: '#5D4037' }}
          >
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            장기적 제안
          </h3>
          <div className="space-y-4">
            {actionPlans.long_term_suggestions.map((suggestion, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-lg p-4"
              >
                <div className="flex items-start">
                  <span 
                    className="text-sm font-semibold px-3 py-1 rounded-full mr-4"
                    style={{ 
                      backgroundColor: 'rgba(147, 107, 58, 0.2)',
                      color: '#5D4037'
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
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: '#8B4513' }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
          </svg>
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