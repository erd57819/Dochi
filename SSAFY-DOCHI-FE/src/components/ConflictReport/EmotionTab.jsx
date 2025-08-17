import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5percent from '@amcharts/amcharts5/percent';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

const EmotionTab = ({ selectedSpeaker, setSelectedSpeaker }) => {
  const { roomId } = useParams();
  const [emotionHistoryData, setEmotionHistoryData] = useState({});
  const [speakers, setSpeakers] = useState([]);
  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const lineRoot = useRef(null);
  const pieRoot = useRef(null);

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

  // amCharts 정리 함수
  useEffect(() => {
    return () => {
      if (lineRoot.current) {
        lineRoot.current.dispose();
      }
      if (pieRoot.current) {
        pieRoot.current.dispose();
      }
    };
  }, []);
  
  const getLineChartData = () => {
    if (!emotionHistoryData[selectedSpeaker]) return [];
    
    const speakerData = emotionHistoryData[selectedSpeaker];
    if (!speakerData || speakerData.length === 0) return [];

    // 시간 간격을 5초로 샘플링 (너무 많은 데이터포인트 방지)
    const sampledData = speakerData.filter((_, index) => index % 5 === 0);
    
    return sampledData.map((item, index) => {
      const date = new Date(item.timestamp);
      const timeLabel = `${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
      
      return {
        time: timeLabel,
        timestamp: index,
        angry: item.angry,
        sad: item.sad,
        happy: item.happy,
        surprised: item.surprised,
        neutral: item.neutral
      };
    });
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
    const emotionSummary = getEmotionSummary();
    if (!emotionSummary) return [];

    const emotionNames = {
      angry: '화남', sad: '슬픔', happy: '행복', 
      surprised: '놀람', neutral: '무표정'
    };

    const emotionColors = {
      angry: '#EF4444',
      sad: '#3B82F6',
      happy: '#10B981',
      surprised: '#F59E0B',
      neutral: '#6B7280'
    };

    return Object.keys(emotionSummary.averages).map(emotion => ({
      emotion: emotionNames[emotion],
      value: emotionSummary.averages[emotion],
      color: emotionColors[emotion]
    }));
  };

  // amCharts 라인 차트 생성
  useLayoutEffect(() => {
    const chartData = getLineChartData();
    if (!chartData.length || !lineChartRef.current) return;

    // 기존 차트 정리
    if (lineRoot.current) {
      lineRoot.current.dispose();
    }

    const root = am5.Root.new(lineChartRef.current);
    lineRoot.current = root;

    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true
      })
    );

    const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineY.set("visible", false);

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "time",
        renderer: am5xy.AxisRendererX.new(root, {
          cellStartLocation: 0.1,
          cellEndLocation: 0.9
        }),
        tooltip: am5.Tooltip.new(root, {})
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        min: 0,
        max: 100,
        renderer: am5xy.AxisRendererY.new(root, {
          strokeDasharray: [1, 3]
        })
      })
    );

    const emotions = [
      { field: 'angry', name: '화남', color: '#EF4444' },
      { field: 'sad', name: '슬픔', color: '#3B82F6' },
      { field: 'happy', name: '행복', color: '#10B981' },
      { field: 'surprised', name: '놀람', color: '#F59E0B' },
      { field: 'neutral', name: '무표정', color: '#6B7280' }
    ];

    emotions.forEach(emotion => {
      const series = chart.series.push(
        am5xy.LineSeries.new(root, {
          name: emotion.name,
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: emotion.field,
          categoryXField: "time",
          stroke: am5.color(emotion.color),
          tooltip: am5.Tooltip.new(root, {
            labelText: "{name}: {valueY}%"
          })
        })
      );

      series.strokes.template.setAll({
        strokeWidth: 2
      });

      series.bullets.push(() => {
        return am5.Bullet.new(root, {
          sprite: am5.Circle.new(root, {
            strokeWidth: 2,
            stroke: series.get("stroke"),
            radius: 3,
            fill: am5.color(emotion.color)
          })
        });
      });

      series.data.setAll(chartData);
    });

    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50
      })
    );

    legend.data.setAll(chart.series.values);

    xAxis.data.setAll(chartData);

    chart.appear(1000, 100);
  }, [selectedSpeaker, emotionHistoryData]);

  // amCharts 파이 차트 생성
  useLayoutEffect(() => {
    const chartData = getPieChartData();
    if (!chartData.length || !pieChartRef.current) return;

    // 기존 차트 정리
    if (pieRoot.current) {
      pieRoot.current.dispose();
    }

    const root = am5.Root.new(pieChartRef.current);
    pieRoot.current = root;

    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
        innerRadius: am5.percent(50)
      })
    );

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: "value",
        categoryField: "emotion",
        alignLabels: true
      })
    );

    series.slices.template.setAll({
      strokeWidth: 2,
      stroke: am5.color("#ffffff")
    });

    // 라벨 설정 - 모든 라벨 표시하되 겹침 방지
    series.labels.template.setAll({
      textType: "regular",
      fontSize: "10px",
      fontWeight: "500",
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 5,
      paddingRight: 5
    });

    // 라벨 텍스트에 퍼센트 추가
    series.labels.template.set("text", "{category}: {valuePercentTotal.formatNumber('#.0')}%");

    // 틱 라인 설정 - 라벨을 빈 공간으로 연결
    series.ticks.template.setAll({
      strokeOpacity: 1,
      stroke: am5.color("#666666"),
      strokeWidth: 1,
      strokeDasharray: [2, 2]
    });

    // 라벨이 차트 경계를 벗어나지 않도록 설정
    series.labels.template.set("maxWidth", 120);
    series.labels.template.set("oversizedBehavior", "wrap");

    // 커스텀 색상 적용
    series.slices.template.adapters.add("fill", (fill, target) => {
      const dataItem = target.dataItem;
      if (dataItem) {
        const data = dataItem.dataContext;
        return am5.color(data.color);
      }
      return fill;
    });

    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
        marginTop: 15,
        marginBottom: 15
      })
    );

    legend.data.setAll(series.dataItems);

    series.data.setAll(chartData);

    series.appear(1000, 100);
  }, [selectedSpeaker, emotionHistoryData]);

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
      {selectedSpeaker && getLineChartData().length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            {selectedSpeaker}님의 감정 분석
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 감정 변화 추이 (라인 차트) */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-4">실시간 감정 변화 추이</h4>
              <div ref={lineChartRef} style={{ height: '350px', width: '100%' }}></div>
            </div>
            
            {/* 감정 분포 (파이 차트) */}
            {emotionSummary && getPieChartData().length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-4">전체 감정 분포</h4>
                <div ref={pieChartRef} style={{ height: '350px', width: '100%' }}></div>
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