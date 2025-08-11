import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { conflictReportApi } from '../services/conflictReportApi';

// Chart.js 설정
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, ArcElement
);

// 컴포넌트 임포트
import ReportSummaryCards from '../components/ConflictReport/ReportSummaryCards';
import SummaryTab from '../components/ConflictReport/SummaryTab';
import EmotionTab from '../components/ConflictReport/EmotionTab';
import ResponsibilityTab from '../components/ConflictReport/ResponsibilityTab';
import ActionPlanTab from '../components/ConflictReport/ActionPlanTab';
import TranscriptTab from '../components/ConflictReport/TranscriptTab';

const ConflictReportPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedSpeaker, setSelectedSpeaker] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [roomId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      console.log('[갈등 레포트] API 호출 시작, roomId:', roomId);
      
      const data = await conflictReportApi.getFullReport(roomId);
      console.log('[갈등 레포트] API 응답 받음:', data);
      console.log('[레포트 구조] sections:', Object.keys(data?.sections || {}));
      
      // summary 섹션 상세 로그
      if (data?.sections?.summary) {
        console.log('[Summary 섹션]', data.sections.summary);
      } else {
        console.log('[경고] Summary 섹션이 없음!');
      }
      
      // responsibility_analysis 섹션 상세 로그
      if (data?.sections?.responsibility_analysis) {
        console.log('[Responsibility 섹션]', data.sections.responsibility_analysis);
      } else {
        console.log('[경고] Responsibility 섹션이 없음!');
      }
      
      // action_plans 섹션 상세 로그
      if (data?.sections?.action_plans) {
        console.log('[Action Plans 섹션]', data.sections.action_plans);
      } else {
        console.log('[경고] Action Plans 섹션이 없음!');
      }
      
      setReportData(data);
      
      // 첫 번째 화자 선택
      const speakers = Object.keys(data?.sections?.emotion_analysis?.data || {});
      if (speakers.length > 0) {
        setSelectedSpeaker(speakers[0]);
      }
    } catch (err) {
      console.error('레포트 로딩 실패:', err);
      setError('레포트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#f0f4ff]">
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#bf7d2c] mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">갈등 분석 레포트를 생성중입니다...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#f0f4ff]">
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <p className="text-xl text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/mypage')}
              className="px-6 py-3 bg-[#bf7d2c] text-white rounded-lg hover:bg-[#a06624] transition-colors"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'summary', label: '종합 요약' },
    { id: 'emotion', label: '감정 분석' },
    { id: 'responsibility', label: '책임 분석' },
    { id: 'action', label: '액션 플랜' },
    { id: 'transcript', label: '대화 내용' },
  ];

  const summary = reportData?.sections?.summary?.data || {};
  const emotionSummary = reportData?.sections?.emotion_analysis?.summary || {};

  return (
    <div className="min-h-screen">
      {/* 헤더 섹션 - Casa Lunara 스타일 다크 배경 */}
      <section className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
        {/* 배경 블러 효과 */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-gray-600 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-gray-700 rounded-full blur-3xl opacity-30"></div>
        </div>
        
        <div className="container mx-auto px-8 py-16 text-center z-10">
          <h1 className="text-7xl font-bold mb-6 leading-tight text-[#F1EFE0]">
            갈등 분석
            <br />
            <span className="text-6xl font-light">레포트</span>
          </h1>
          <p className="text-xl text-[#F1EFE0] mb-8 opacity-70 font-light">
            AI가 분석한 갈등의 깊이와 해결책을 만나보세요
          </p>
          <p className="text-[#F1EFE0] opacity-50 text-sm">
            생성 시간: {new Date(reportData?.generated_at).toLocaleString('ko-KR')}
          </p>
          
          {/* 스크롤 힌트 */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-[#F1EFE0] rounded-full flex justify-center opacity-60">
              <div className="w-1 h-3 bg-[#F1EFE0] rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 종합 요약 섹션 */}
      <section className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-850 to-gray-800 flex items-center py-20">
        <div className="container mx-auto px-8 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-light mb-6 text-[#F1EFE0]">
              종합 요약
            </h2>
            <p className="text-xl text-[#F1EFE0] opacity-60 font-light">갈등의 전체적인 모습을 한눈에</p>
          </div>
          
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-12 border border-[#F1EFE0]/10">
            <SummaryTab summary={summary} />
          </div>
        </div>
      </section>

      {/* 감정 분석 섹션 */}
      <section className="min-h-screen bg-gradient-to-b from-gray-800 via-gray-750 to-gray-700 flex items-center py-20">
        <div className="container mx-auto px-8 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-light mb-6 text-[#F1EFE0]">
              감정 분석
            </h2>
            <p className="text-xl text-[#F1EFE0] opacity-60 font-light">대화 속 숨겨진 감정의 흐름</p>
          </div>
          
          <div className="bg-black/60 backdrop-blur-md rounded-2xl p-12 border border-[#F1EFE0]/10">
            <EmotionTab 
              selectedSpeaker={selectedSpeaker}
              setSelectedSpeaker={setSelectedSpeaker}
            />
          </div>
        </div>
      </section>

      {/* 책임 분석 섹션 */}
      <section className="min-h-screen bg-gradient-to-b from-gray-700 via-gray-650 to-gray-600 flex items-center py-20">
        <div className="container mx-auto px-8 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-light mb-6 text-[#F1EFE0]">
              책임 분석
            </h2>
            <p className="text-xl text-[#F1EFE0] opacity-60 font-light">갈등의 원인과 각자의 역할</p>
          </div>
          
          <div className="bg-black/50 backdrop-blur-md rounded-2xl p-12 border border-[#F1EFE0]/10">
            <ResponsibilityTab 
              responsibilityData={reportData?.sections?.responsibility_analysis?.data}
            />
          </div>
        </div>
      </section>

      {/* 액션 플랜 섹션 */}
      <section className="min-h-screen bg-gradient-to-b from-gray-600 via-gray-550 to-gray-500 flex items-center py-20">
        <div className="container mx-auto px-8 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-light mb-6 text-[#F1EFE0]">
              액션 플랜
            </h2>
            <p className="text-xl text-[#F1EFE0] opacity-60 font-light">구체적인 해결 방안과 실행 계획</p>
          </div>
          
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-12 border border-[#F1EFE0]/10">
            <ActionPlanTab 
              actionPlans={reportData?.sections?.action_plans?.data || {}}
            />
          </div>
        </div>
      </section>

      {/* 대화 내용 섹션 */}
      <section className="min-h-screen bg-gradient-to-b from-gray-500 via-gray-450 to-gray-400 flex items-center py-20">
        <div className="container mx-auto px-8 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-light mb-6 text-[#F1EFE0]">
              대화 내용
            </h2>
            <p className="text-xl text-[#F1EFE0] opacity-60 font-light">실제 대화의 전체 기록</p>
          </div>
          
          <div className="bg-black/30 backdrop-blur-md rounded-2xl p-12 border border-[#F1EFE0]/10">
            <TranscriptTab 
              transcriptData={reportData?.sections?.full_transcript}
            />
          </div>
        </div>
      </section>

      {/* 액션 버튼 섹션 */}
      <section className="bg-gradient-to-b from-gray-400 to-gray-300 py-20">
        <div className="container mx-auto px-8 max-w-4xl text-center">
          <h3 className="text-4xl font-light mb-8 text-[#F1EFE0]">
            레포트 활용하기
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => navigate('/mypage')}
              className="px-8 py-4 bg-black/70 text-[#F1EFE0] rounded-full hover:bg-black/80 transition-all duration-500 backdrop-blur-sm border border-[#F1EFE0]/20 font-light text-lg"
            >
              마이페이지로 돌아가기
            </button>
            
            <button
              onClick={() => window.print()}
              className="px-8 py-4 bg-black/60 text-[#F1EFE0] rounded-full hover:bg-black/70 transition-all duration-500 backdrop-blur-sm border border-[#F1EFE0]/20 font-light text-lg"
            >
              레포트 인쇄하기
            </button>
            
            <button
              onClick={() => alert('PDF 다운로드 기능은 준비중입니다.')}
              className="px-8 py-4 bg-black/50 text-[#F1EFE0] rounded-full hover:bg-black/60 transition-all duration-500 backdrop-blur-sm border border-[#F1EFE0]/20 font-light text-lg"
            >
              PDF 다운로드
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ConflictReportPage;