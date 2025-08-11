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

// 도치 이미지들 임포트
import dochiImage10 from '../assets/image 10.png';
import dochiImage65 from '../assets/image-65.png';
import dochiImage16 from '../assets/image-16.png';
import dochiImage17 from '../assets/image 17.png';
import dochiImage18 from '../assets/image 18.png';
import dochiImage9 from '../assets/image 9.png';
import conflictImage from '../assets/conflict.png';

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
      {/* 헤더 + 종합 요약 섹션 */}
      <section className="min-h-screen bg-gradient-to-br from-[#F5F1E8] via-[#FAF6ED] to-[#F0EBE0] relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-96 h-96 bg-[#D4B896] rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#C8A882] rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-8 py-16 relative z-10">
          {/* 헤더 */}
          <div className="text-center mb-16 relative">
            <div className="flex justify-center items-center mb-8">
              <img 
                src={dochiImage10} 
                alt="도치" 
                className="w-24 h-24 mr-6 opacity-80"
              />
              <h1 className="text-6xl font-bold leading-tight text-[#8B5A3C]">
                갈등 분석 레포트
              </h1>
              <img 
                src={dochiImage65} 
                alt="도치" 
                className="w-24 h-24 ml-6 opacity-80"
              />
            </div>
            <p className="text-xl text-[#A0713E] mb-6 opacity-80">
              AI가 분석한 갈등의 깊이와 해결책을 만나보세요
            </p>
            <p className="text-[#8B5A3C] opacity-60 text-sm">
              생성 시간: {new Date(reportData?.generated_at).toLocaleString('ko-KR')}
            </p>
            
            {/* 헤더 장식용 도치 */}
            <div className="absolute -top-4 -right-4 opacity-30">
              <img src={dochiImage17} alt="도치" className="w-16 h-16" />
            </div>
            <div className="absolute -bottom-4 -left-4 opacity-30">
              <img src={dochiImage18} alt="도치" className="w-16 h-16" />
            </div>
          </div>

          {/* 종합 요약 바로 표시 */}
          <div className="max-w-6xl mx-auto relative">
            <div className="text-center mb-12 relative">
              <div className="flex justify-center items-center mb-4">
                <img 
                  src={conflictImage} 
                  alt="갈등분석" 
                  className="w-16 h-16 mr-4 opacity-70"
                />
                <h2 className="text-4xl font-bold text-[#8B5A3C]">
                  종합 요약
                </h2>
              </div>
              <p className="text-lg text-[#A0713E] opacity-70">갈등의 전체적인 모습을 한눈에</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 border-2 border-[#D4B896]/30 relative">
              <SummaryTab summary={summary} />
              {/* 요약 카드 장식용 도치 */}
              <div className="absolute -top-6 -right-6 opacity-20">
                <img src={dochiImage16} alt="도치" className="w-20 h-20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 감정 분석 섹션 */}
      <section className="min-h-screen bg-gradient-to-br from-[#F0EBE0] via-[#EDE6DB] to-[#E8E0D3] flex items-center py-20 relative">
        {/* 섹션 장식용 도치 */}
        <div className="absolute top-10 left-10 opacity-20">
          <img src={dochiImage9} alt="도치" className="w-32 h-32" />
        </div>
        <div className="absolute bottom-10 right-10 opacity-15">
          <img src={dochiImage17} alt="도치" className="w-28 h-28" />
        </div>
        
        <div className="container mx-auto px-8 max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <div className="flex justify-center items-center mb-6">
              <img 
                src={dochiImage65} 
                alt="도치" 
                className="w-20 h-20 mr-4 opacity-60"
              />
              <h2 className="text-5xl font-bold text-[#7A4F32]">
                감정 분석
              </h2>
            </div>
            <p className="text-xl text-[#8B5A3C] opacity-70">대화 속 숨겨진 감정의 흐름</p>
          </div>
          
          <div className="bg-[#FAF6ED]/90 backdrop-blur-sm rounded-3xl shadow-xl p-12 border-2 border-[#C8A882]/30 relative">
            <EmotionTab 
              selectedSpeaker={selectedSpeaker}
              setSelectedSpeaker={setSelectedSpeaker}
            />
            {/* 감정분석 카드 장식용 도치 */}
            <div className="absolute -bottom-4 -left-4 opacity-25">
              <img src={dochiImage10} alt="도치" className="w-16 h-16" />
            </div>
          </div>
        </div>
      </section>

      {/* 책임 분석 섹션 */}
      <section className="min-h-screen bg-gradient-to-br from-[#E8E0D3] via-[#E3D9CC] to-[#DDD1C2] flex items-center py-20 relative">
        {/* 섹션 장식용 도치 */}
        <div className="absolute top-20 right-20 opacity-20">
          <img src={dochiImage18} alt="도치" className="w-36 h-36" />
        </div>
        
        <div className="container mx-auto px-8 max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <div className="flex justify-center items-center mb-6">
              <h2 className="text-5xl font-bold text-[#6B4226]">
                책임 분석
              </h2>
              <img 
                src={dochiImage16} 
                alt="도치" 
                className="w-20 h-20 ml-4 opacity-60"
              />
            </div>
            <p className="text-xl text-[#7A4F32] opacity-70">갈등의 원인과 각자의 역할</p>
          </div>
          
          <div className="bg-[#F5F1E8]/95 backdrop-blur-sm rounded-3xl shadow-xl p-12 border-2 border-[#BCA284]/30 relative">
            <ResponsibilityTab 
              responsibilityData={reportData?.sections?.responsibility_analysis?.data}
            />
            {/* 책임분석 카드 장식용 도치 */}
            <div className="absolute -top-6 -left-6 opacity-25">
              <img src={dochiImage65} alt="도치" className="w-18 h-18" />
            </div>
          </div>
        </div>
      </section>

      {/* 액션 플랜 섹션 */}
      <section className="min-h-screen bg-gradient-to-br from-[#DDD1C2] via-[#D6C8B7] to-[#CFBFAB] flex items-center py-20 relative">
        {/* 섹션 장식용 도치 */}
        <div className="absolute bottom-20 left-20 opacity-20">
          <img src={dochiImage10} alt="도치" className="w-40 h-40" />
        </div>
        <div className="absolute top-16 right-16 opacity-15">
          <img src={dochiImage9} alt="도치" className="w-24 h-24" />
        </div>
        
        <div className="container mx-auto px-8 max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <div className="flex justify-center items-center mb-6">
              <img 
                src={dochiImage17} 
                alt="도치" 
                className="w-20 h-20 mr-4 opacity-60"
              />
              <h2 className="text-5xl font-bold text-[#5C351A]">
                액션 플랜
              </h2>
            </div>
            <p className="text-xl text-[#6B4226] opacity-70">구체적인 해결 방안과 실행 계획</p>
          </div>
          
          <div className="bg-white backdrop-blur-sm rounded-3xl shadow-xl p-12 border-2 border-[#B09A7E]/30 relative">
            <ActionPlanTab 
              actionPlans={reportData?.sections?.action_plans?.data || {}}
            />
            {/* 액션플랜 카드 장식용 도치 */}
            <div className="absolute -bottom-6 -right-6 opacity-20">
              <img src={dochiImage18} alt="도치" className="w-20 h-20" />
            </div>
          </div>
        </div>
      </section>

      {/* 대화 내용 섹션 */}
      <section className="min-h-screen bg-gradient-to-br from-[#CFBFAB] via-[#C7B59F] to-[#BEAB93] flex items-center py-20">
        <div className="container mx-auto px-8 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 text-[#4D280E]">
              대화 내용
            </h2>
            <p className="text-xl text-[#5C351A] opacity-70">실제 대화의 전체 기록</p>
          </div>
          
          <div className="bg-[#FAF6ED] backdrop-blur-sm rounded-3xl shadow-xl p-12 border-2 border-[#A4936E]/30">
            <TranscriptTab 
              transcriptData={reportData?.sections?.full_transcript}
            />
          </div>
        </div>
      </section>

      {/* 액션 버튼 섹션 */}
      <section className="bg-gradient-to-br from-[#BEAB93] via-[#B5A084] to-[#AB9574] py-20">
        <div className="container mx-auto px-8 max-w-4xl text-center">
          <h3 className="text-4xl font-bold mb-8 text-[#3E1F0A]">
            레포트 활용하기
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => navigate('/mypage')}
              className="px-8 py-4 bg-[#8B5A3C] text-[#FAF6ED] rounded-full hover:bg-[#7A4F32] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              마이페이지로 돌아가기
            </button>
            
            <button
              onClick={() => window.print()}
              className="px-8 py-4 bg-[#A0713E] text-[#FAF6ED] rounded-full hover:bg-[#8B5A3C] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
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