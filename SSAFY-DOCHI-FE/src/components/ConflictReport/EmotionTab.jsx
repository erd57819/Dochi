import React from 'react';
import { Line } from 'react-chartjs-2';

const EmotionTab = ({ emotionData, selectedSpeaker, setSelectedSpeaker }) => {
  const speakers = Object.keys(emotionData || {});
  
  const getChartData = () => {
    if (!emotionData?.[selectedSpeaker]) return null;
    
    const graphData = emotionData[selectedSpeaker].graph_data;
    if (!graphData) return null;

    return {
      labels: graphData.labels || [],
      datasets: [{
        label: '감정 점수',
        data: graphData.scores || [],
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        tension: 0.4,
      }],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: false, min: -1, max: 1 },
    },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">감정 변화 분석</h2>
      
      {/* 화자 선택 버튼 */}
      {selectedSpeaker && (
        <div className="flex space-x-4 mb-6">
          {speakers.map(speaker => (
            <button
              key={speaker}
              onClick={() => setSelectedSpeaker(speaker)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedSpeaker === speaker
                  ? 'bg-[#bf7d2c] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {speaker}
            </button>
          ))}
        </div>
      )}

      {/* 감정 그래프 */}
      {selectedSpeaker && getChartData() && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {selectedSpeaker}님의 감정 변화 추이
          </h3>
          <div style={{ height: '300px' }}>
            <Line data={getChartData()} options={chartOptions} />
          </div>
        </div>
      )}

      {/* 감정 요약 정보 */}
      {selectedSpeaker && emotionData?.[selectedSpeaker]?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#f8d6b3] bg-opacity-30 rounded-lg p-4">
            <h4 className="font-semibold text-[#7f5539] mb-2">주요 감정</h4>
            <p className="text-2xl font-bold text-gray-800">
              {emotionData[selectedSpeaker].summary.dominant_emotion || '분석중'}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">평균 감정 점수</h4>
            <p className="text-2xl font-bold text-gray-800">
              {emotionData[selectedSpeaker].summary.average_score?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionTab;