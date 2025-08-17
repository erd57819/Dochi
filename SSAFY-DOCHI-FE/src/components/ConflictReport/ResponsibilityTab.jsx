import React, { useRef, useLayoutEffect } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5radar from '@amcharts/amcharts5/radar';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

const ResponsibilityTab = ({ responsibilityData }) => {
  // 백엔드에서 받은 데이터 확인
  console.log('ResponsibilityTab received:', responsibilityData);
  const chartRef = useRef(null);
  const root = useRef(null);
  
  const getChartData = () => {
    if (!responsibilityData?.responsibility_analysis) return [];

    const respAnalysis = responsibilityData.responsibility_analysis;
    const speakers = Object.keys(respAnalysis);
    const colors = ['#7f5539', '#cd9f6e', '#f8d6b3', '#83673f'];
    
    return speakers.map((speaker, index) => ({
      name: respAnalysis[speaker].name || speaker,
      value: respAnalysis[speaker].responsibility_percentage || 0,
      color: colors[index % colors.length]
    }));
  };

  // amCharts 게이지 차트 설정
  useLayoutEffect(() => {
    const chartData = getChartData();
    if (!chartData.length || !chartRef.current) return;

    // 기존 차트 정리
    if (root.current) {
      root.current.dispose();
    }

    const chartRoot = am5.Root.new(chartRef.current);
    root.current = chartRoot;

    chartRoot.setThemes([am5themes_Animated.new(chartRoot)]);

    // 하나의 게이지 차트로 모든 참가자 표시
    const chart = chartRoot.container.children.push(
      am5radar.RadarChart.new(chartRoot, {
        panX: false,
        panY: false,
        wheelX: "none",
        wheelY: "none",
        innerRadius: am5.percent(20),
        width: am5.percent(100),
        height: am5.percent(100)
      })
    );

    // 원형 축 생성 (0-100%)
    const xRenderer = am5radar.AxisRendererCircular.new(chartRoot, {
      minGridDistance: 30
    });
    
    xRenderer.grid.template.setAll({
      strokeOpacity: 0.1
    });

    xRenderer.labels.template.setAll({
      fontSize: "10px",
      fontWeight: "500"
    });

    const xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(chartRoot, {
        maxZoomCount: 1,
        min: 0,
        max: 100,
        strictMinMax: true,
        renderer: xRenderer
      })
    );

    // Y축 (반지름 방향) - 각 참가자별로
    const yRenderer = am5radar.AxisRendererRadial.new(chartRoot, {
      minGridDistance: 15
    });

    yRenderer.labels.template.setAll({
      centerX: am5.p100,
      fontWeight: "600",
      fontSize: "11px"
    });

    const yAxis = chart.yAxes.push(
      am5xy.CategoryAxis.new(chartRoot, {
        categoryField: "name",
        renderer: yRenderer
      })
    );

    // 시리즈 생성
    const series = chart.series.push(
      am5radar.RadarColumnSeries.new(chartRoot, {
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: "value",
        categoryYField: "name"
      })
    );

    // 컬럼 스타일링 - 각 참가자별 색상
    series.columns.template.setAll({
      strokeOpacity: 0,
      cornerRadiusTL: 2,
      cornerRadiusTR: 2,
      width: am5.percent(60)
    });

    // 각 컬럼에 다른 색상 적용
    series.columns.template.adapters.add("fill", (fill, target) => {
      const dataItem = target.dataItem;
      if (dataItem) {
        const index = series.dataItems.indexOf(dataItem);
        return am5.color(chartData[index]?.color || "#8B4513");
      }
      return fill;
    });

    // 데이터 설정
    series.data.setAll(chartData);
    yAxis.data.setAll(chartData);

    // 중앙에 총합 표시
    const centerLabel = chart.plotContainer.children.push(
      am5.Label.new(chartRoot, {
        text: "책임 비중\n분석",
        centerX: am5.p50,
        centerY: am5.p50,
        textAlign: "center",
        fontSize: "14px",
        fontWeight: "700",
        fill: am5.color("#333333")
      })
    );

    // 범례 추가
    const legend = chart.children.push(
      am5.Legend.new(chartRoot, {
        centerX: am5.p50,
        x: am5.p50,
        marginTop: 20,
        layout: chartRoot.horizontalLayout
      })
    );

    // 범례 데이터 설정
    legend.data.setAll(chartData.map(item => ({
      name: `${item.name}: ${item.value}%`,
      color: am5.color(item.color)
    })));

    // 애니메이션
    series.appear(1000);
    chart.appear(1000, 100);

    return () => {
      chartRoot.dispose();
    };
  }, [responsibilityData]);

  return (
    <div className="space-y-6">
      
      {/* 책임 비중 차트와 상세 분석 */}
      {getChartData() && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">책임 비중 게이지</h3>
            <div ref={chartRef} style={{ height: '300px', width: '100%' }}></div>
          </div>

          {/* 상세 분석 */}
          <div className="space-y-4">
            {Object.entries(responsibilityData.responsibility_analysis || {}).map(([key, speaker]) => (
              <div key={key} className="pl-4">
                <h4 className="font-semibold text-gray-800">
                  {speaker.name} ({speaker.responsibility_percentage}%)
                </h4>
                
                {/* 갈등관리 유형 표시 */}
                {speaker.conflict_management_type && (
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      speaker.conflict_management_type === '경쟁형' ? 'bg-orange-100' :
                      speaker.conflict_management_type === '수용형' ? 'bg-amber-100' :
                      speaker.conflict_management_type === '회피형' ? 'bg-stone-100' :
                      speaker.conflict_management_type === '타협형' ? 'bg-yellow-100' :
                      speaker.conflict_management_type === '협력형' ? 'bg-orange-100' :
                      'bg-brown-100'
                    }`} style={{
                      color: speaker.conflict_management_type === '경쟁형' ? '#8B4513' :
                      speaker.conflict_management_type === '수용형' ? '#654321' :
                      speaker.conflict_management_type === '회피형' ? '#5D4037' :
                      speaker.conflict_management_type === '타협형' ? '#8B4513' :
                      speaker.conflict_management_type === '협력형' ? '#8B4513' :
                      '#6D4C41'
                    }}>
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                      </svg>
                      갈등관리 유형: {speaker.conflict_management_type}
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
        <h3 className="text-lg font-semibold text-[#2A2A2A] mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
          갈등관리 유형별 특징
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-orange-50 p-4">
            <div className="flex items-center mb-2">
              <svg className="w-3 h-3 mr-2" style={{ color: '#8B4513' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <h4 className="font-medium" style={{ color: '#8B4513' }}>경쟁형 (Competing)</h4>
            </div>
            <p className="text-sm" style={{ color: '#A0522D' }}>자신의 목표를 우선시하며 상대방과의 협력보다는 승부를 중시</p>
          </div>
          
          <div className="bg-amber-50 p-4">
            <div className="flex items-center mb-2">
              <svg className="w-3 h-3 mr-2" style={{ color: '#654321' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <h4 className="font-medium" style={{ color: '#654321' }}>수용형 (Accommodating)</h4>
            </div>
            <p className="text-sm" style={{ color: '#8B6914' }}>관계 유지를 위해 자신의 욕구를 포기하고 상대방을 우선시</p>
          </div>
          
          <div className="bg-stone-50 p-4">
            <div className="flex items-center mb-2">
              <svg className="w-3 h-3 mr-2" style={{ color: '#5D4037' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <h4 className="font-medium" style={{ color: '#5D4037' }}>회피형 (Avoiding)</h4>
            </div>
            <p className="text-sm" style={{ color: '#6D4C41' }}>갈등 상황 자체를 피하거나 늦추려는 경향</p>
          </div>
          
          <div className="bg-yellow-50 p-4">
            <div className="flex items-center mb-2">
              <svg className="w-3 h-3 mr-2" style={{ color: '#8B4513' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <h4 className="font-medium" style={{ color: '#8B4513' }}>타협형 (Compromising)</h4>
            </div>
            <p className="text-sm" style={{ color: '#A0522D' }}>양측이 어느 정도 양보하여 중간 지점에서 해결책 모색</p>
          </div>
          
          <div className="bg-orange-100 p-4">
            <div className="flex items-center mb-2">
              <svg className="w-3 h-3 mr-2" style={{ color: '#8B4513' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <h4 className="font-medium" style={{ color: '#8B4513' }}>협력형 (Collaborating)</h4>
            </div>
            <p className="text-sm" style={{ color: '#A0522D' }}>양방 모두가 만족할 수 있는 창의적 해결책 추구</p>
          </div>
        </div>
      </div>

      {/* 갈등 고조 지점 */}
      {responsibilityData?.escalation_points && responsibilityData.escalation_points.length > 0 && (
        <div className="bg-red-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-3">갈등 고조 지점</h3>
          <div className="space-y-3">
            {responsibilityData.escalation_points.map((point, idx) => (
              <div key={idx} className="pl-4">
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
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: '#8B4513' }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <p className="text-gray-500 text-lg">책임 분석 데이터가 생성되지 않았습니다.</p>
          <p className="text-gray-400 text-sm mt-2">대화 내용을 바탕으로 책임 비율을 분석 중입니다...</p>
        </div>
      )}
    </div>
  );
};

export default ResponsibilityTab;