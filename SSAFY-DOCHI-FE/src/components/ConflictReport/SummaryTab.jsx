import React from 'react';

const SummaryTab = ({ summary }) => {
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
      
      <div className="space-y-6 relative z-10">
        <h2 
          className="text-2xl font-bold mb-4"
          style={{
            background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          종합 분석 요약
        </h2>
        
        {/* 핵심 이슈 */}
        {summary.key_issues && summary.key_issues.length > 0 && (
          <div 
            className="rounded-lg p-6 border-2"
            style={{ 
              background: 'linear-gradient(135deg, #F8D6B3, #FFE4CC)',
              borderColor: '#BF7D2C',
              boxShadow: '0 4px 6px rgba(191, 125, 44, 0.1)'
            }}
          >
            <h3 
              className="text-lg font-semibold mb-3"
              style={{ color: '#8B4513' }}
            >
              핵심 갈등 요인
            </h3>
            <ul className="space-y-2">
              {summary.key_issues.map((issue, idx) => (
                <li key={idx} className="flex items-start">
                  <span style={{ color: '#BF7D2C' }} className="mr-2">•</span>
                  <span style={{ color: '#333333' }}>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 즉시 실행 항목 */}
        {summary.immediate_actions && summary.immediate_actions.length > 0 && (
          <div 
            className="rounded-lg p-6 border-2"
            style={{ 
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderColor: '#22C55E',
              boxShadow: '0 4px 6px rgba(34, 197, 94, 0.1)'
            }}
          >
            <h3 
              className="text-lg font-semibold mb-3"
              style={{ color: '#15803D' }}
            >
              즉시 실행이 필요한 행동
            </h3>
            <ol className="space-y-2">
              {summary.immediate_actions.map((action, idx) => (
                <li key={idx} className="flex items-start">
                  <span style={{ color: '#22C55E' }} className="mr-2 font-bold">{idx + 1}.</span>
                  <span style={{ color: '#333333' }}>{action}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* 전문가 도움 필요 여부 */}
        {summary.professional_help_needed && (
          <div 
            className="border-l-4 p-4 rounded-r-lg"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: '#EF4444'
            }}
          >
            <p 
              className="font-semibold"
              style={{ color: '#DC2626' }}
            >
              ⚠️ 전문가의 도움이 필요할 수 있습니다
            </p>
            <p 
              className="text-sm mt-2"
              style={{ color: '#B91C1C' }}
            >
              갈등의 수준이 높아 전문 상담사나 중재자의 도움을 받는 것을 권장합니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryTab;