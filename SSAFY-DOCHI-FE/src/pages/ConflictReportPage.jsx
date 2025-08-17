import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { conflictReportApi } from '../services/conflictReportApi';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import consultantDochiImg from '../assets/consultantdochi.png';


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
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [roomId]);

  const checkAccess = () => {
    // localStorage에서 해당 roomId에 대한 접근 토큰 확인
    const accessToken = localStorage.getItem(`conflict_report_token_${roomId}`);
    
    if (!accessToken) {
      console.log('갈등 레포트 접근 토큰이 없음:', roomId);
      setError('이 레포트에 접근할 권한이 없습니다. 화상 통화를 완료한 후에만 접근할 수 있습니다.');
      setLoading(false);
      setHasAccess(false);
      return;
    }
    
    console.log('갈등 레포트 접근 토큰 확인됨:', accessToken);
    setHasAccess(true);
    fetchReport();
  };

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
    } catch (err) {
      console.error('레포트 로딩 실패:', err);
      setError('레포트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative">
        {/* 배경 오버레이 */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundColor: '#F8D6B3',
            opacity: 0.14,
            zIndex: 1
          }}
        ></div>
        
        <div className="flex items-center justify-center h-[80vh] relative z-10">
          <div className="text-center">
            <LoadingSpinner type="gif" size="xlarge" />
            <p 
              className="text-lg mt-4"
              style={{ 
                color: '#333333',
                background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              갈등 분석 레포트를 생성중입니다...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !hasAccess) {
    return (
      <div className="min-h-screen relative">
        {/* 배경 오버레이 */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundColor: '#F8D6B3',
            opacity: 0.14,
            zIndex: 1
          }}
        ></div>
        
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 text-center border" style={{ borderColor: '#BF7D2C' }}>
            <div className="mb-6">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#BF7D2C' }}
              >
                <span className="text-white text-2xl">🔒</span>
              </div>
              <h2 
                className="text-2xl font-semibold mb-4"
                style={{
                  background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                접근 권한 없음
              </h2>
              <p className="mb-6" style={{ color: '#333333' }}>
                {error || '이 레포트에 접근할 권한이 없습니다.'}
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full px-6 py-3 text-white font-semibold rounded-lg transition-colors"
                style={{ backgroundColor: '#BF7D2C' }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#8B4513';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#BF7D2C';
                }}
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'summary', label: '종합 요약' },
    { id: 'responsibility', label: '책임 분석' },
    { id: 'action', label: '액션 플랜' },
    { id: 'transcript', label: '대화 내용' },
  ];

  const summary = reportData?.sections?.summary?.data || {};
  const emotionSummary = reportData?.sections?.emotion_analysis?.summary || {};

  return (
    <div className="relative min-h-screen">
      {/* 첫 번째 섹션 - 상단 배경 (오버레이) */}
      <div className="w-full relative">
        {/* 배경 오버레이 */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundColor: '#F8D6B3',
            opacity: 0.14,
            zIndex: 1
          }}
        ></div>
        
        {/* 헤더 + 종합 요약 섹션 */}
        <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* 미묘한 텍스처 오버레이 */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-800 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-amber-900 rounded-full blur-3xl"></div>
        </div>
        
        <main className="max-w-5xl mx-auto px-4 py-12 relative z-10">
          {/* 헤더 */}
          <div className="relative mb-20">
            {/* 오른쪽 상단에 도치 이미지 */}
            <div className="absolute right-0 top-0 z-20">
              <img 
                src={consultantDochiImg} 
                alt="컨설턴트 도치" 
                className="w-56 h-56 object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
              />
            </div>
            
            {/* 중앙 정렬된 헤더 텍스트 */}
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-4" style={{ 
                background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                갈등 분석 레포트
              </h1>
              <p className="text-gray-600 text-lg font-normal tracking-wide">
                AI가 분석한 갈등의 깊이와 해결책을 만나보세요
              </p>
              <p className="text-gray-500 text-sm mt-4 font-normal">
                생성 시간: {new Date(reportData?.generated_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
              </p>
            </div>
          </div>

          {/* 종합 요약 */}
          <div className="p-12 mb-12">
            <h3 className="text-3xl font-bold text-center mb-12" style={{
              background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              종합 분석 요약
            </h3>
            
            <div className="bg-white p-6 rounded-lg">
              <SummaryTab summary={summary} />
            </div>
          </div>
        </main>
      </section>
      </div>

      {/* 두 번째 섹션 - 흰색 배경 */}
      <div className="w-full relative">
        {/* 배경 오버레이 */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundColor: '#FFFFFF',
            zIndex: 1
          }}
        ></div>
        
        <main className="max-w-5xl mx-auto px-4 relative z-10">
          {/* 상세 분석 결과 헤더 */}
          <div className="text-center mb-16 pt-12">
            <h2 className="text-5xl font-bold" style={{ 
              background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              상세 분석 결과
            </h2>
          </div>

          {/* 감정 분석 섹션 */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold" style={{
                background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                감정 분석
              </h3>
              <p className="text-gray-600 text-lg mt-4">대화 속 숨겨진 감정의 흐름</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg">
              <EmotionTab 
                selectedSpeaker={selectedSpeaker}
                setSelectedSpeaker={setSelectedSpeaker}
              />
            </div>
          </div>
        </main>
      </div>

      {/* 세 번째 섹션 - 오버레이 배경 */}
      <div className="w-full relative">
        {/* 배경 오버레이 */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundColor: '#F8D6B3',
            opacity: 0.14,
            zIndex: 1
          }}
        ></div>
        
        <main className="max-w-5xl mx-auto px-4 relative z-10 py-16">
          {/* 책임 분석 섹션 */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold" style={{
                background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                책임 분석
              </h3>
              <p className="text-gray-600 text-lg mt-4">갈등의 원인과 각자의 역할</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg">
              <ResponsibilityTab 
                responsibilityData={reportData?.sections?.responsibility_analysis?.data}
              />
            </div>
          </div>
        </main>
      </div>

      {/* 네 번째 섹션 - 흰색 배경 */}
      <div className="w-full relative">
        {/* 배경 오버레이 */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundColor: '#FFFFFF',
            zIndex: 1
          }}
        ></div>
        
        <main className="max-w-5xl mx-auto px-4 relative z-10 py-16">
          {/* 액션 플랜 섹션 */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold" style={{
                background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                액션 플랜
              </h3>
              <p className="text-gray-600 text-lg mt-4">구체적인 해결 방안과 실행 계획</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg">
              <ActionPlanTab 
                actionPlans={reportData?.sections?.action_plans?.data || {}}
              />
            </div>
          </div>
        </main>
      </div>

      {/* 다섯 번째 섹션 - 오버레이 배경 */}
      <div className="w-full relative">
        {/* 배경 오버레이 */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundColor: '#F8D6B3',
            opacity: 0.14,
            zIndex: 1
          }}
        ></div>
        
        <main className="max-w-5xl mx-auto px-4 relative z-10 py-16">
          {/* 대화 내용 섹션 */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold" style={{
                background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                대화 내용
              </h3>
              <p className="text-gray-600 text-lg mt-4">실제 대화의 전체 기록</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg">
              <TranscriptTab 
                transcriptData={reportData?.sections?.full_transcript}
              />
            </div>
          </div>

          {/* 액션 버튼 섹션 */}
          <div className="text-center py-16">
            <h3 className="text-3xl font-bold mb-6" style={{ color: '#333333' }}>
              레포트 활용하기
            </h3>
            <p className="text-gray-600 text-lg mb-8">갈등 레포트는 따로 저장되지 않습니다. 저장을 원하시면 레포트 인쇄 버튼을 눌러 pdf로 저장하세요.</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={() => navigate('/mypage')}
                className="px-8 py-3 text-white font-medium text-lg rounded-lg transition-colors"
                style={{ backgroundColor: '#8B4513' }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#654321';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#8B4513';
                }}
              >
                마이페이지로 돌아가기
              </button>
              
              <button
                onClick={() => window.print()}
                className="px-8 py-3 text-white font-medium text-lg rounded-lg transition-colors"
                style={{ backgroundColor: '#BF7D2C' }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#A66D2A';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#BF7D2C';
                }}
              >
                레포트 인쇄하기
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ConflictReportPage;