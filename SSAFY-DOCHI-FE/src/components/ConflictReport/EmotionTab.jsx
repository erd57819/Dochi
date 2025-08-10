import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { useParams } from 'react-router-dom';

const EmotionTab = ({ selectedSpeaker, setSelectedSpeaker }) => {
  const { roomId } = useParams();
  const [emotionHistoryData, setEmotionHistoryData] = useState({});
  const [speakers, setSpeakers] = useState([]);

  // localStorage에서 감정 히스토리 데이터 로드
  useEffect(() => {
    const emotionHistoryKey = `emotion_history_${roomId}`;
    const savedData = localStorage.getItem(emotionHistoryKey);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setEmotionHistoryData(parsedData);
        setSpeakers(Object.keys(parsedData));
        
        // 첫 번째 화자를 기본 선택
        if (!selectedSpeaker && Object.keys(parsedData).length > 0) {
          setSelectedSpeaker(Object.keys(parsedData)[0]);
        }
        
        console.log('[감정 히스토리 로드 완료]', Object.keys(parsedData));
      } catch (error) {
        console.error('[감정 히스토리 로드 실패]', error);
      }
    } else {
      console.log('[감정 히스토리] 데이터 없음');
    }
  }, [roomId, selectedSpeaker, setSelectedSpeaker]);
  
  const getChartData = () => {
    if (!emotionHistoryData[selectedSpeaker]) return null;
    
    const speakerData = emotionHistoryData[selectedSpeaker];
    if (!speakerData || speakerData.length === 0) return null;

    // 시간 간격을 5초로 샘플링 (너무 많은 데이터포인트 방지)
    const sampledData = speakerData.filter((_, index) => index % 5 === 0);
    
    // 시간 라벨 생성
    const labels = sampledData.map((item, index) => {
      const date = new Date(item.timestamp);
      return `${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    });

    // 각 감정별 데이터셋 생성
    const datasets = [
      {
        label: '화남',
        data: sampledData.map(item => item.angry),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        pointRadius: 2,
      },
      {
        label: '슬픔',
        data: sampledData.map(item => item.sad),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        pointRadius: 2,
      },
      {
        label: '행복',
        data: sampledData.map(item => item.happy),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        pointRadius: 2,
      },
      {
        label: '놀람',
        data: sampledData.map(item => item.surprised),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        pointRadius: 2,
      },
      {
        label: '중립',
        data: sampledData.map(item => item.neutral),
        borderColor: '#6B7280',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        tension: 0.4,
        pointRadius: 2,
      }
    ];

    return { labels, datasets };
  };

  // 감정 요약 데이터 계산
  const getEmotionSummary = () => {
    if (!emotionHistoryData[selectedSpeaker]) return null;
    
    const speakerData = emotionHistoryData[selectedSpeaker];
    if (!speakerData || speakerData.length === 0) return null;

    // 평균값 계산
    const averages = {
      angry: 0, sad: 0, happy: 0, surprised: 0, neutral: 0
    };

    speakerData.forEach(item => {
      averages.angry += item.angry;
      averages.sad += item.sad;
      averages.happy += item.happy;
      averages.surprised += item.surprised;
      averages.neutral += item.neutral;
    });

    Object.keys(averages).forEach(key => {
      averages[key] = averages[key] / speakerData.length;
    });

    // 주요 감정 찾기
    const dominantEmotion = Object.keys(averages).reduce((a, b) => 
      averages[a] > averages[b] ? a : b
    );

    const emotionNames = {
      angry: '화남', sad: '슬픔', happy: '행복', 
      surprised: '놀람', neutral: '중립'
    };

    return {
      dominant_emotion: emotionNames[dominantEmotion],
      average_score: averages[dominantEmotion],
      total_samples: speakerData.length,
      averages
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
        }
      },
    },
    scales: {
      y: { 
        beginAtZero: true, 
        min: 0, 
        max: 100,
        title: {
          display: true,
          text: '감정 점수 (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: '시간 (분:초)'
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  const emotionSummary = getEmotionSummary();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">감정 변화 분석</h2>
      
      {/* 데이터 없음 메시지 */}
      {speakers.length === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                감정 분석 데이터가 없습니다. 화상통화 중 Face-API를 통해 수집된 데이터를 표시합니다.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* 화자 선택 버튼 */}
      {speakers.length > 0 && (
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
            {selectedSpeaker}님의 실시간 감정 변화 추이
          </h3>
          <div style={{ height: '400px' }}>
            <Line data={getChartData()} options={chartOptions} />
          </div>
        </div>
      )}

      {/* 감정 요약 정보 */}
      {selectedSpeaker && emotionSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#f8d6b3] bg-opacity-30 rounded-lg p-4">
            <h4 className="font-semibold text-[#7f5539] mb-2">주요 감정</h4>
            <p className="text-2xl font-bold text-gray-800">
              {emotionSummary.dominant_emotion}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">평균 감정 점수</h4>
            <p className="text-2xl font-bold text-gray-800">
              {emotionSummary.average_score.toFixed(1)}%
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">분석 샘플 수</h4>
            <p className="text-2xl font-bold text-gray-800">
              {emotionSummary.total_samples}개
            </p>
          </div>
        </div>
      )}

      {/* 감정별 상세 분석 */}
      {selectedSpeaker && emotionSummary && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">감정별 평균 점수</h4>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(emotionSummary.averages).map(([emotion, score]) => {
              const emotionColors = {
                angry: 'bg-red-100 text-red-800',
                sad: 'bg-blue-100 text-blue-800',
                happy: 'bg-green-100 text-green-800',
                surprised: 'bg-yellow-100 text-yellow-800',
                neutral: 'bg-gray-100 text-gray-800'
              };
              const emotionNames = {
                angry: '화남', sad: '슬픔', happy: '행복',
                surprised: '놀람', neutral: '중립'
              };
              
              return (
                <div key={emotion} className={`rounded-lg p-3 text-center ${emotionColors[emotion]}`}>
                  <p className="text-sm font-medium">{emotionNames[emotion]}</p>
                  <p className="text-lg font-bold">{score.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionTab;