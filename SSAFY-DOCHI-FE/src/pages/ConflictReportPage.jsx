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
      const data = await conflictReportApi.getFullReport(roomId);
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
              onClick={() => navigate('/conflicts')}
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
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f0f4ff]">
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#FF9800] to-[#bf7d2c] bg-clip-text text-transparent">
              갈등 분석 레포트
            </span>
          </h1>
          <p className="text-gray-600">
            생성 시간: {new Date(reportData?.generated_at).toLocaleString('ko-KR')}
          </p>
        </div>

        {/* 요약 카드 */}
        <ReportSummaryCards summary={summary} emotionSummary={emotionSummary} />

        {/* 탭 네비게이션 */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 font-semibold transition-colors ${
                activeTab === tab.id 
                  ? 'text-[#bf7d2c] border-b-2 border-[#bf7d2c]' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {activeTab === 'summary' && <SummaryTab summary={summary} />}
          
          {activeTab === 'emotion' && (
            <EmotionTab 
              selectedSpeaker={selectedSpeaker}
              setSelectedSpeaker={setSelectedSpeaker}
            />
          )}
          
          {activeTab === 'responsibility' && (
            <ResponsibilityTab 
              responsibilityData={reportData?.sections?.responsibility_analysis?.data}
            />
          )}
          
          {activeTab === 'action' && (
            <ActionPlanTab 
              actionPlans={reportData?.sections?.action_plans?.data || {}}
            />
          )}
          
          {activeTab === 'transcript' && (
            <TranscriptTab 
              transcriptData={reportData?.sections?.full_transcript}
            />
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => navigate('/conflicts')}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            목록으로
          </button>
          
          <div className="space-x-4">
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-[#cd9f6e] text-white rounded-lg hover:bg-[#b88956] transition-colors"
            >
              레포트 인쇄
            </button>
            <button
              onClick={() => alert('PDF 다운로드 기능은 준비중입니다.')}
              className="px-6 py-3 bg-[#7f5539] text-white rounded-lg hover:bg-[#6a4630] transition-colors"
            >
              PDF 다운로드
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictReportPage;