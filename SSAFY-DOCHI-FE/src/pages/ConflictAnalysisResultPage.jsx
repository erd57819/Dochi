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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={hedgehogImg} alt="참견도치" className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-gray-800">참견도치</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="text-gray-600 hover:text-gray-800"
            >
              갈등목록
            </button>
            <button className="text-gray-600 hover:text-gray-800">로그인</button>
            <button className="text-gray-600 hover:text-gray-800">회원가입</button>
            <button className="text-gray-600 hover:text-gray-800">갈등도치 커뮤니티</button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 상단 메시지 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-amber-700 mb-4">
            입력해주신 결과를 기반으로 리포트가 나왔어요
          </h2>
        </div>

        {/* 갈등 분석 카드 */}
        <div className="bg-white rounded-3xl p-8 mb-12">
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">
            {conflictData?.title || '집안일 분담 관련 갈등'}
          </h3>

          <div className="flex items-start gap-8">
            {/* 고슴도치 이미지 */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 bg-gray-200 rounded-full flex items-center justify-center">
                <div className="flex gap-2">
                  <span className="text-6xl">🦔</span>
                  <span className="text-6xl">🦔</span>
                </div>
              </div>
            </div>

            {/* 분석 내용 */}
            <div className="flex-1 space-y-6">
              <div>
                <h4 className="font-bold text-lg mb-2 flex items-center">
                  <span className="w-2 h-2 bg-amber-600 rounded-full mr-2"></span>
                  상황:
                </h4>
                <p className="text-gray-700 leading-relaxed ml-4">
                  {conflictData?.aiSummary || '맞벌이 부부인데 집안일 분담 문제로 갈등 발생'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2 flex items-center">
                  <span className="w-2 h-2 bg-amber-600 rounded-full mr-2"></span>
                  원인:
                </h4>
                <p className="text-gray-700 leading-relaxed ml-4">
                  {conflictData?.description || '아내는 본인이 대부분의 집안일을 하고 있다고 느끼고, 남편은 퇴근 후 피곤하다는 이유로 적극적으로 참여하지 않음'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2 flex items-center">
                  <span className="w-2 h-2 bg-amber-600 rounded-full mr-2"></span>
                  입장 정리:
                </h4>
                <div className="space-y-3 ml-4">
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                    <span className="font-medium text-blue-800">아내:</span>
                    <span className="text-blue-700 ml-2">"나도 직장 다니는데 집안일을 도맡고 있어 너무 힘들어."</span>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                    <span className="font-medium text-green-800">남편:</span>
                    <span className="text-green-700 ml-2">"일이 너무 힘들고 쉬고 싶어서 그랬지, 미안한 마음은 있어."</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-block bg-amber-100 px-6 py-2 rounded-full">
              <h4 className="text-xl font-bold text-amber-800">
                {conflictData?.conflictType === 'FAMILY' ? '가족갈등' : 
                 conflictData?.conflictType === 'FRIEND' ? '친구갈등' :
                 conflictData?.conflictType === 'COUPLE' ? '부부갈등' :
                 conflictData?.conflictType === 'WORK' ? '직장갈등' : '기타갈등'}
              </h4>
            </div>
          </div>
        </div>

        {/* 하단 메시지 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-amber-700">
            리포트를 기반으로 '맞춤 해결책'을 제안해드릴게요
          </h2>
        </div>

        {/* 서비스 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* 갈등해결하기 카드 */}
          <div className="bg-amber-800 text-white rounded-2xl p-8 relative overflow-hidden cursor-pointer hover:bg-amber-900 transition-colors">
            <h3 className="text-2xl font-bold mb-4">참견도치와 갈등 해결하기</h3>
            <p className="text-amber-100 mb-6 leading-relaxed">
              화상 대화 속 갈등과 대화를 위한, AI 갈등 도우미 갈등도치가 갈등 중재를 도와줄게요
            </p>
            <div className="absolute bottom-4 right-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </div>
          </div>

          {/* 갈등 커뮤니티 카드 */}
          <div className="bg-amber-600 text-white rounded-2xl p-8 relative overflow-hidden cursor-pointer hover:bg-amber-700 transition-colors">
            <h3 className="text-2xl font-bold mb-4">갈등 커뮤니티</h3>
            <p className="text-amber-100 mb-6 leading-relaxed">
              사람들의 다양한 갈등을 확인하고 함께 공유해보세요
              전성한 투표로 갈정까지！
            </p>
            <div className="absolute bottom-4 right-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </div>
          </div>

          {/* 5단계 해결 로드맵 카드 */}
          <div className="bg-amber-300 text-amber-900 rounded-2xl p-8 relative overflow-hidden cursor-pointer hover:bg-amber-400 transition-colors">
            <h3 className="text-2xl font-bold mb-4">5단계<br/>해결 로드맵</h3>
            <p className="text-amber-800 mb-6 leading-relaxed">
              비슷한 고민을 가진 사람들과 이야기해보세요
            </p>
            <div className="absolute bottom-4 right-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </div>
          </div>

          {/* 토닥토닥 서비스 카드 */}
          <div className="bg-amber-800 text-white rounded-2xl p-8 relative overflow-hidden cursor-pointer hover:bg-amber-900 transition-colors">
            <h3 className="text-2xl font-bold mb-4">토닥토닥 서비스</h3>
            <p className="text-amber-100 mb-6 leading-relaxed">
              참견도치 챗봇이 고민을 들어주고, 당신의 이야기를 따뜻하게 정리해줄게요
            </p>
            <div className="absolute bottom-4 right-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* 하단 버튼들 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleNewConflict}
            className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
          >
            다시 작성하기
          </button>
          <button
            onClick={handleSaveConflict}
            className="px-6 py-3 bg-amber-700 text-white rounded-xl hover:bg-amber-800 transition-colors"
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
