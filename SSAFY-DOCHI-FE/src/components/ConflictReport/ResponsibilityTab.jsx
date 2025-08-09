import React from 'react';
import { Doughnut } from 'react-chartjs-2';

const ResponsibilityTab = ({ responsibilityData }) => {
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

      {/* 갈등 고조 지점 */}
      {responsibilityData.escalation_points && responsibilityData.escalation_points.length > 0 && (
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
    </div>
  );
};

export default ResponsibilityTab;