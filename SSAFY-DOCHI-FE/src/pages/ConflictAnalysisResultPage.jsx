import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import useAuthStore from '../stores/AuthStore';
import hedgehogImg from '../assets/conflict.png';

const ConflictAnalysisResultPage = () => {
  const [conflictData, setConflictData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { tempId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  useEffect(() => {
    if (tempId) {
      fetchTempConflictData();
    }
  }, [tempId]);

  const fetchTempConflictData = async () => {
    try {
      // sessionStorage에서 데이터 가져오기
      const tempData = {
        title: sessionStorage.getItem('tempTitle') || '갈등 제목',
        description: sessionStorage.getItem('tempDescription') || '갈등 설명',
        conflictType: sessionStorage.getItem('tempConflictType') || 'ETC',
        aiSummary: sessionStorage.getItem('tempAiSummary') || '분석 결과를 불러오는 중입니다...',
        aiSolutions: sessionStorage.getItem('tempAiSolutions') || '해결방안을 불러오는 중입니다...'
      };
      
      console.log('Loaded temp data:', tempData);
      setConflictData(tempData);
    } catch (error) {
      console.error('임시 갈등 데이터 조회 실패:', error);
      // 기본 데이터 설정
      setConflictData({
        title: '갈등 제목',
        description: '갈등 설명',
        conflictType: 'ETC',
        aiSummary: '분석 결과를 가져오지 못했습니다.',
        aiSolutions: '해결방안을 가져오지 못했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConflict = async () => {
    if (!tempId) {
      alert('임시 저장된 갈등 데이터가 없습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/conflict/analyze/advanced/save/${tempId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        alert('갈등 카드가 성공적으로 생성되었습니다! 🦔');
        navigate('/conflicts');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '갈등 카드 생성에 실패했습니다.');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/conflicts');
  };

  const handleNewConflict = () => {
    navigate('/conflicts/create');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-gray-600">결과를 불러오는 중...</p>
          {/* 전문상담사 매칭 카드 */}
          <div 
            className="text-white rounded-3xl p-10 relative overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:-translate-y-2 shadow-xl"
            style={{ background: '#EE9278' }}
          >
            <h3 className="text-2xl font-bold mb-6">전문상담사 매칭</h3>
            <p className="mb-8 leading-relaxed opacity-90">
              나의 대화중재 기록을 확인하고<br/>
              관리해요
            </p>
            <div className="absolute bottom-8 right-8">
              <span className="text-2xl">→</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* 전체 배경 컨테이너 */}
      <div className="absolute inset-0">
        {/* 상단 배경 - F8D6B3 14% */}
        <div 
          className="absolute top-0 left-0 w-full" 
          style={{ 
            height: '45%',
            backgroundColor: '#F8D6B3',
            opacity: 0.14
          }}
        ></div>
        
        {/* 하단 배경 - 흰색 */}
        <div 
          className="absolute bottom-0 left-0 w-full" 
          style={{ 
            height: '55%',
            backgroundColor: '#FFFFFF'
          }}
        ></div>
      </div>
      {/* 메인 컨텐츠 */}
      <main className="max-w-5xl mx-auto px-4 py-12 relative z-10">
        {/* 상단 메시지 */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold mb-4" style={{ 
            background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            입력해주신 결과를 기반으로 리포트가 나왔어요
          </h2>
        </div>

        {/* 갈등 분석 카드 */}
        <div className="p-12 mb-25">
          <h3 className="text-3xl font-bold text-center mb-12" style={{ color: '#333333' }}>
            {conflictData?.title || '집안일 분담 관련 갈등'}
          </h3>

          <div className="flex items-start gap-20">
            {/* 고슴도치 이미지 */}
            <div className="flex-shrink-0">
              <div 
                className="w-60 h-60 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #E8E8E8, #D0D0D0)' }}
              >
                <img 
                  src={hedgehogImg} 
                  alt="갈등도치" 
                  className="w-44 h-44 object-contain"
                />
              </div>
              {/* 부부갈등 소제목 */}
              <div className="text-center mt-6">
                <h4 className="text-2xl font-bold" style={{ color: '#333333' }}>
                  부부갈등
                </h4>
              </div>
            </div>

            {/* 분석 내용 */}
            <div className="flex-1 space-y-8">
              <div>
                <h4 className="font-bold text-xl mb-4" style={{ color: '#333333' }}>
                  • 상황: 맞벌이 부부인데 집안일 분담 문제로 갈등 발생
                </h4>
              </div>

              <div>
                <h4 className="font-bold text-xl mb-4" style={{ color: '#333333' }}>
                  • 원인: 아내는 본인이 대부분의 집안일을 하고 있다고 느끼고, 남편은 퇴근 후 피곤하다는 이유로 적극적으로 참여하지 않음
                </h4>
              </div>

              <div>
                <h4 className="font-bold text-xl mb-4" style={{ color: '#333333' }}>
                  • 입장 정리:
                </h4>
                <div className="ml-6 space-y-4">
                  <div className="pl-4">
                    <div className="mb-2">
                      <span className="font-medium" style={{ color: '#8B4513' }}>아내:</span>
                      <span className="ml-2" style={{ color: '#333333' }}>"나도 직장 다니는데 집안일을 도맡고 있어 너무 힘들어."</span>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: '#8B4513' }}>남편:</span>
                      <span className="ml-2" style={{ color: '#333333' }}>"일이 너무 힘들고 쉬고 싶어서 그랬지, 미안한 마음은 있어."</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 메시지 */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold" style={{ 
            background: 'linear-gradient(45deg, #BF7D2C, #FFB120)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            리포트를 기반으로 '맞춤 해결책'을 제안해드릴게요
          </h2>
        </div>

        {/* 서비스 카드들 */}
        <div className="mb-16">
          {/* 첫 번째 줄 - 2개 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* 갈등해결하기 카드 */}
            <div 
              className="text-white rounded-3xl p-10 relative overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:-translate-y-2 shadow-xl"
              style={{ background: '#83673f' }}
            >
              <h3 className="text-2xl font-bold mb-6">참견도치와 갈등 해결하기</h3>
              <p className="mb-8 leading-relaxed opacity-90">
                화상 대화 속 감정과 대화를 읽고, AI 갈등 도우미 참견도치가 갈등 중재를 도와줘요
              </p>
              <div className="absolute bottom-8 right-8">
                <span className="text-2xl">→</span>
              </div>
            </div>

            {/* 갈등 커뮤니티 카드 */}
            <div 
              className="text-white rounded-3xl p-10 relative overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:-translate-y-2 shadow-xl"
              style={{ background: '#cd9f6e' }}
            >
              <h3 className="text-2xl font-bold mb-6">갈등 커뮤니티</h3>
              <p className="mb-8 leading-relaxed opacity-90">
                사람들의 다양한 갈등을<br/>
                학인하고 함께 공유해보세요<br/>
                전반한 토론도 참여까지 !
              </p>
              <div className="absolute bottom-8 right-8">
                <span className="text-2xl">→</span>
              </div>
            </div>
          </div>

          {/* 두 번째 줄 - 3개 작은 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 5단계 해결 로드맵 카드 */}
            <div 
              className="rounded-3xl p-8 relative overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:-translate-y-2 shadow-xl"
              style={{ background: '#f8d6b3', color: '#3d2b1f' }}
            >
              <h3 className="text-xl font-bold mb-4">5단계<br/>해결 로드맵</h3>
              <p className="mb-6 leading-relaxed opacity-90 text-sm">
                비슷한 고민을 가진 사람<br/>
                들과 이야기해보세요
              </p>
              <div className="absolute bottom-6 right-6">
                <span className="text-xl">→</span>
              </div>
            </div>

            {/* 토닥토닥 서비스 카드 */}
            <div 
              className="text-white rounded-3xl p-8 relative overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:-translate-y-2 shadow-xl"
              style={{ background: '#7F5539' }}
            >
              <h3 className="text-xl font-bold mb-4">토닥토닥 서비스</h3>
              <p className="mb-6 leading-relaxed opacity-90 text-sm">
                참견도치 챗봇이 고민을 들어주고, 당신의 이야기를 따뜻하게 정리해줘요
              </p>
              <div className="absolute bottom-6 right-6">
                <span className="text-xl">→</span>
              </div>
            </div>

            {/* 전문상담사 매칭 카드 */}
            <div 
              className="text-white rounded-3xl p-8 relative overflow-hidden cursor-pointer hover:opacity-90 transition-all transform hover:-translate-y-2 shadow-xl"
              style={{ background: '#EE9278' }}
            >
              <h3 className="text-xl font-bold mb-4">전문상담사 매칭</h3>
              <p className="mb-6 leading-relaxed opacity-90 text-sm">
                나의 대화중재 기록을 확인하고<br/>
                관리해요
              </p>
              <div className="absolute bottom-6 right-6">
                <span className="text-xl">→</span>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼들 */}
        <div className="flex justify-center gap-6">
          <button
            onClick={handleNewConflict}
            className="px-8 py-4 text-white rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 shadow-lg font-medium"
            style={{ background: '#696969' }}
          >
            다시 작성하기
          </button>
          <button
            onClick={handleSaveConflict}
            className="px-8 py-4 text-white rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 shadow-lg font-medium"
            style={{ background: '#8B4513' }}
            disabled={isLoading}
          >
            {isLoading ? '저장 중...' : '갈등 카드 저장하기'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default ConflictAnalysisResultPage;
