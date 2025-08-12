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
      {/* 헤더 + 종합 요약 섹션 - Jia Curated 스타일 */}
      <section className="min-h-screen bg-[#F2EDE2] flex items-center justify-center relative overflow-hidden">
        {/* 미묘한 텍스처 오버레이 */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-800 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-amber-900 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-12 py-24 max-w-6xl relative z-10">
          {/* 헤더 */}
          <div className="text-center mb-20">
            <h1 className="text-6xl font-light mb-8 text-[#2A2A2A] tracking-tight">
              갈등 분석 레포트
            </h1>
            <div className="w-24 h-0.5 bg-[#8B5A3C] mx-auto mb-8"></div>
            <p className="text-[#6B5B5B] text-lg font-light tracking-wide">
              AI가 분석한 갈등의 깊이와 해결책을 만나보세요
            </p>
            <p className="text-[#8B7B7B] text-sm mt-4 font-light">
              생성 시간: {new Date(reportData?.generated_at).toLocaleString('ko-KR')}
            </p>
          </div>

          {/* 종합 요약 */}
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-light text-[#2A2A2A] mb-4 tracking-tight">
                종합 분석 요약
              </h2>
              <div className="w-16 h-0.5 bg-[#8B5A3C] mx-auto mb-8"></div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm shadow-2xl p-16 rounded-none border-l-4 border-[#8B5A3C]">
              <SummaryTab summary={summary} />
            </div>
          </div>
        </div>
      </section>

      {/* 감정 분석 섹션 */}
      <section className="min-h-screen bg-[#EAE3D8] flex items-center py-24">
        <div className="container mx-auto px-12 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light text-[#2A2A2A] mb-6 tracking-tight">
              감정 분석
            </h2>
            <div className="w-16 h-0.5 bg-[#6B4226] mx-auto mb-8"></div>
            <p className="text-[#5A5A5A] text-xl font-light">대화 속 숨겨진 감정의 흐름</p>
          </div>
          
          <div className="bg-white shadow-xl p-16 rounded-none border-l-4 border-[#6B4226]">
            <EmotionTab 
              selectedSpeaker={selectedSpeaker}
              setSelectedSpeaker={setSelectedSpeaker}
            />
          </div>
        </div>
      </section>

      {/* 책임 분석 섹션 */}
      <section className="min-h-screen bg-[#E0D7C9] flex items-center py-24">
        <div className="container mx-auto px-12 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light text-[#2A2A2A] mb-6 tracking-tight">
              책임 분석
            </h2>
            <div className="w-16 h-0.5 bg-[#5C351A] mx-auto mb-8"></div>
            <p className="text-[#4A4A4A] text-xl font-light">갈등의 원인과 각자의 역할</p>
          </div>
          
          <div className="bg-[#FEFCF8] shadow-xl p-16 rounded-none border-l-4 border-[#5C351A]">
            <ResponsibilityTab 
              responsibilityData={reportData?.sections?.responsibility_analysis?.data}
            />
          </div>
        </div>
      </section>

      {/* 액션 플랜 섹션 */}
      <section className="min-h-screen bg-[#D6CDB8] flex items-center py-24">
        <div className="container mx-auto px-12 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light text-[#2A2A2A] mb-6 tracking-tight">
              액션 플랜
            </h2>
            <div className="w-16 h-0.5 bg-[#4D280E] mx-auto mb-8"></div>
            <p className="text-[#3A3A3A] text-xl font-light">구체적인 해결 방안과 실행 계획</p>
          </div>
          
          <div className="bg-[#F8F5F0] shadow-xl p-16 rounded-none border-l-4 border-[#4D280E]">
            <ActionPlanTab 
              actionPlans={reportData?.sections?.action_plans?.data || {}}
            />
          </div>
        </div>
      </section>

      {/* 대화 내용 섹션 */}
      <section className="min-h-screen bg-[#CCC2A7] flex items-center py-24">
        <div className="container mx-auto px-12 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light text-[#2A2A2A] mb-6 tracking-tight">
              대화 내용
            </h2>
            <div className="w-16 h-0.5 bg-[#3E1F0A] mx-auto mb-8"></div>
            <p className="text-[#2A2A2A] text-xl font-light">실제 대화의 전체 기록</p>
          </div>
          
          <div className="bg-[#F2EDE2] shadow-xl p-16 rounded-none border-l-4 border-[#3E1F0A]">
            <TranscriptTab 
              transcriptData={reportData?.sections?.full_transcript}
            />
          </div>
        </div>
      </section>

      {/* 액션 버튼 섹션 */}
      <section className="bg-[#C2B596] py-24">
        <div className="container mx-auto px-12 max-w-4xl text-center">
          <h3 className="text-4xl font-light mb-6 text-[#2A2A2A] tracking-tight">
            레포트 활용하기
          </h3>
          <p className="text-[#4A4A4A] text-xl font-light mb-8">갈등 레포트는 따로 저장되지 않습니다. 저장을 원하시면 레포트 인쇄 버튼을 눌러 pdf로 저장하세요.</p>
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
            <button
              onClick={() => navigate('/mypage')}
              className="px-10 py-4 bg-[#2A2A2A] text-[#F2EDE2] font-light text-lg tracking-wide hover:bg-[#1A1A1A] transition-all duration-500 uppercase"
            >
              마이페이지로 돌아가기
            </button>
            
            <button
              onClick={() => window.print()}
              className="px-10 py-4 bg-[#5C351A] text-[#F2EDE2] font-light text-lg tracking-wide hover:bg-[#4D280E] transition-all duration-500 uppercase"
            >
              레포트 인쇄하기
            </button>
            
          </div>
        </div>
      </section>
    </div>
  );
};

export default ConflictReportPage;