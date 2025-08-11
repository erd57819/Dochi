import React from 'react';

const SummaryTab = ({ summary }) => {
  // 받은 데이터 확인
  console.log('[SummaryTab] 받은 summary 데이터:', summary);
  console.log('[SummaryTab] summary 키들:', Object.keys(summary || {}));
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">종합 분석 요약</h2>
      
      {/* 핵심 이슈 */}
      {summary.key_issues && summary.key_issues.length > 0 && (
        <div className="bg-[#f8d6b3] bg-opacity-30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#7f5539] mb-3">핵심 갈등 요인</h3>
          <ul className="space-y-2">
            {summary.key_issues.map((issue, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-[#bf7d2c] mr-2">•</span>
                <span className="text-gray-700">{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 즉시 실행 항목 */}
      {summary.immediate_actions && summary.immediate_actions.length > 0 && (
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-3">즉시 실행이 필요한 행동</h3>
          <ol className="space-y-2">
            {summary.immediate_actions.map((action, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">{idx + 1}.</span>
                <span className="text-gray-700">{action}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 전문가 도움 필요 여부 */}
      {summary.professional_help_needed && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-800 font-semibold">
            ⚠️ 전문가의 도움이 필요할 수 있습니다
          </p>
          <p className="text-red-700 text-sm mt-2">
            갈등의 수준이 높아 전문 상담사나 중재자의 도움을 받는 것을 권장합니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default SummaryTab;