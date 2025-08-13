import React from 'react';
import { Doughnut } from 'react-chartjs-2';

const ResponsibilityTab = ({ responsibilityData }) => {
  // 백엔드에서 받은 데이터 확인
  console.log('ResponsibilityTab received:', responsibilityData);
  
  const getChartData = () => {
    if (!responsibilityData?.responsibility_analysis) return null;

    const respAnalysis = responsibilityData.responsibility_analysis;
    const speakers = Object.keys(respAnalysis);
    const percentages = speakers.map(speaker => 
      respAnalysis[speaker].responsibility_percentage || 0
    );
    const names = speakers.map(speaker => 
      respAnalysis[speaker].name || speaker
    );

    return {
      labels: names,
      datasets: [{
        data: percentages,
        backgroundColor: ['#7f5539', '#cd9f6e', '#f8d6b3', '#83673f'],
        borderWidth: 0,
      }],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">갈등 책임 분석</h2>
      
      {/* 책임 비중 차트와 상세 분석 */}
      {getChartData() && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">책임 비중 분포</h3>
            <div style={{ height: '250px' }}>
              <Doughnut data={getChartData()} options={chartOptions} />
            </div>
          </div>

          {/* 상세 분석 */}
          <div className="space-y-4">
            {Object.entries(responsibilityData.responsibility_analysis || {}).map(([key, speaker]) => (
              <div key={key} className="border-l-4 border-[#bf7d2c] pl-4">
                <h4 className="font-semibold text-gray-800">
                  {speaker.name} ({speaker.responsibility_percentage}%)
                </h4>
                
                {/* 갈등관리 유형 표시 */}
                {speaker.conflict_management_type && (
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      speaker.conflict_management_type === '경쟁형' ? 'bg-red-100 text-red-800' :
                      speaker.conflict_management_type === '수용형' ? 'bg-blue-100 text-blue-800' :
                      speaker.conflict_management_type === '회피형' ? 'bg-gray-100 text-gray-800' :
                      speaker.conflict_management_type === '타협형' ? 'bg-yellow-100 text-yellow-800' :
                      speaker.conflict_management_type === '협력형' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      🔍 갈등관리 유형: {speaker.conflict_management_type}
                    </span>
                  </div>
                )}
                
                <p className="text-sm text-gray-600 mt-1">
                  의사소통 스타일: {speaker.communication_style}
                </p>
                {speaker.key_issues && speaker.key_issues.length > 0 && (
                  <ul className="text-sm text-gray-700 mt-2">
                    {speaker.key_issues.slice(0, 2).map((issue, idx) => (
                      <li key={idx}>• {issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 갈등관리 유형 설명 */}
      <div className="bg-[#F8F5F0] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[#2A2A2A] mb-4">📊 갈등관리 유형별 특징</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center mb-2">
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              <h4 className="font-medium text-red-800">경쟁형 (Competing)</h4>
            </div>
            <p className="text-sm text-red-700">자신의 목표를 우선시하며 상대방과의 협력보다는 승부를 중시</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              <h4 className="font-medium text-blue-800">수용형 (Accommodating)</h4>
            </div>
            <p className="text-sm text-blue-700">관계 유지를 위해 자신의 욕구를 포기하고 상대방을 우선시</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center mb-2">
              <span className="inline-block w-3 h-3 bg-gray-500 rounded-full mr-2"></span>
              <h4 className="font-medium text-gray-800">회피형 (Avoiding)</h4>
            </div>
            <p className="text-sm text-gray-700">갈등 상황 자체를 피하거나 늦추려는 경향</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center mb-2">
              <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              <h4 className="font-medium text-yellow-800">타협형 (Compromising)</h4>
            </div>
            <p className="text-sm text-yellow-700">양측이 어느 정도 양보하여 중간 지점에서 해결책 모색</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center mb-2">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <h4 className="font-medium text-green-800">협력형 (Collaborating)</h4>
            </div>
            <p className="text-sm text-green-700">양방 모두가 만족할 수 있는 창의적 해결책 추구</p>
          </div>
        </div>
      </div>

      {/* 갈등 고조 지점 */}
      {responsibilityData?.escalation_points && responsibilityData.escalation_points.length > 0 && (
        <div className="bg-red-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-3">갈등 고조 지점</h3>
          <div className="space-y-3">
            {responsibilityData.escalation_points.map((point, idx) => (
              <div key={idx} className="border-l-2 border-red-300 pl-4">
                <p className="text-gray-700">{point.description}</p>
                <p className="text-sm text-gray-600 mt-1">
                  책임: {point.responsible_party}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 데이터가 없을 때 표시 */}
      {(!responsibilityData?.responsibility_analysis || Object.keys(responsibilityData.responsibility_analysis).length === 0) && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚖️</div>
          <p className="text-gray-500 text-lg">책임 분석 데이터가 생성되지 않았습니다.</p>
          <p className="text-gray-400 text-sm mt-2">대화 내용을 바탕으로 책임 비율을 분석 중입니다...</p>
        </div>
      )}
    </div>
  );
};

export default ResponsibilityTab;