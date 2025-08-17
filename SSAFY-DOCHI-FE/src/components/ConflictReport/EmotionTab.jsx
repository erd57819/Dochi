import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
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
        label: '무표정',
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
      surprised: '놀람', neutral: '무표정'
    };

    return {
      dominant_emotion: emotionNames[dominantEmotion],
      average_score: averages[dominantEmotion],
      total_samples: speakerData.length,
      averages
    };
  };

  // 파이차트 데이터 생성
  const getPieChartData = () => {
    if (!emotionSummary) return null;

    const emotionNames = {
      angry: '화남', sad: '슬픔', happy: '행복', 
      surprised: '놀람', neutral: '무표정'
    };

    const emotionColors = [
      '#EF4444', // 화남
      '#3B82F6', // 슬픔  
      '#10B981', // 행복
      '#F59E0B', // 놀람
      '#6B7280', // 중립
    ];

    return {
      labels: Object.keys(emotionSummary.averages).map(emotion => emotionNames[emotion]),
      datasets: [{
        data: Object.values(emotionSummary.averages),
        backgroundColor: emotionColors,
        borderWidth: 2,
        borderColor: '#ffffff',
      }],
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

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.label + ': ' + context.parsed.toFixed(1) + '%';
          }
        }
      }
    },
  };

  const emotionSummary = getEmotionSummary();

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
      
      {/* 데이터 없음 메시지 */}
      {speakers.length === 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                감정 분석 데이터가 없습니다. 화상통화 중 Face-API를 통해 수집된 데이터를 표시합니다.
              </p>
            </div>
          </div>
        </div>
      )}
      
      

      {/* 감정 그래프 - 라인 차트와 파이 차트 */}
      {selectedSpeaker && getChartData() && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            {selectedSpeaker}님의 감정 분석
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 감정 변화 추이 (라인 차트) */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-4">실시간 감정 변화 추이</h4>
              <div style={{ height: '350px' }}>
                <Line data={getChartData()} options={chartOptions} />
              </div>
            </div>
            
            {/* 감정 분포 (파이 차트) */}
            {emotionSummary && getPieChartData() && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-4">전체 감정 분포</h4>
                <div style={{ height: '350px' }}>
                  <Doughnut data={getPieChartData()} options={pieChartOptions} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default EmotionTab;