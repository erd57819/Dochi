import React from 'react';

const Step5AIAnalysis = ({ 
  formData, 
  aiSummary, 
  aiSolutions, 
  advancedAnalysis, 
  isLoading, 
  onSave,
  onPrev 
}) => {
  if (isLoading) {
    return (
      <div className="animate-fadeIn">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-orange-200 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🤖</span>
            </div>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-gray-800">AI가 분석 중입니다...</h3>
          <p className="mt-2 text-gray-600">잠시만 기다려주세요</p>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          
          .animate-spin {
            animation: spin 2s linear infinite;
            border-top-color: #f97316;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* 이전 버튼 - 텍스트만 */}
      <div className="mb-6">
        <span
          onClick={onPrev}
          className="text-gray-500 hover:text-gray-700 transition-colors text-sm cursor-pointer"
        >
          ← 다시 작성하기
        </span>
      </div>
      
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          AI 분석 결과
        </h2>
        <p className="text-xl text-gray-600">
          AI가 분석한 갈등 상황과 해결 방안입니다
        </p>
      </div>

      <div className="space-y-6">
        {/* AI 요약 */}
        <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">상황 요약</h3>
          </div>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {aiSummary}
          </p>
        </div>

        {/* AI 해결방안 */}
        <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xl">💡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">추천 해결방안</h3>
          </div>
          <div className="text-gray-700 whitespace-pre-line leading-relaxed">
            {aiSolutions}
          </div>
        </div>

        {/* 고급 분석 결과 */}
        {advancedAnalysis && (
          <div className="bg-purple-50 border-2 border-purple-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">상세 분석</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 감정 분석 */}
              {advancedAnalysis.emotion_analysis && (
                <div className="bg-white rounded-xl p-4">
                  <h4 className="font-medium text-purple-700 mb-2">😊 감정 분석</h4>
                  <p className="text-sm text-gray-600">{advancedAnalysis.emotion_analysis}</p>
                </div>
              )}

              {/* 관계 건강도 */}
              {advancedAnalysis.relationship_health_score !== undefined && (
                <div className="bg-white rounded-xl p-4">
                  <h4 className="font-medium text-purple-700 mb-2">💙 관계 건강도</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-1000" 
                        style={{width: `${advancedAnalysis.relationship_health_score}%`}}
                      />
                    </div>
                    <span className="text-sm font-bold text-purple-700">
                      {advancedAnalysis.relationship_health_score}/100
                    </span>
                  </div>
                </div>
              )}

              {/* 소통 점수 */}
              {advancedAnalysis.communication_score !== undefined && (
                <div className="bg-white rounded-xl p-4">
                  <h4 className="font-medium text-purple-700 mb-2">💬 소통 점수</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-1000" 
                        style={{width: `${advancedAnalysis.communication_score}%`}}
                      />
                    </div>
                    <span className="text-sm font-bold text-green-700">
                      {advancedAnalysis.communication_score}/100
                    </span>
                  </div>
                </div>
              )}

              {/* 우선순위 추천 */}
              {advancedAnalysis.priority_recommendation && (
                <div className="bg-white rounded-xl p-4">
                  <h4 className="font-medium text-purple-700 mb-2">📋 우선순위</h4>
                  <span className={`
                    inline-block px-3 py-1 rounded-full text-sm font-medium
                    ${advancedAnalysis.priority_recommendation === 'HIGH' 
                      ? 'bg-red-100 text-red-700' 
                      : advancedAnalysis.priority_recommendation === 'MEDIUM'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                    }
                  `}>
                    {advancedAnalysis.priority_recommendation === 'HIGH' ? '높음' :
                     advancedAnalysis.priority_recommendation === 'MEDIUM' ? '보통' : '낮음'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 추가 서비스 */}
        <div className="bg-gray-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 추가 서비스</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button className="flex items-center justify-center gap-2 p-4 bg-white rounded-xl
              hover:bg-blue-50 hover:border-blue-200 border-2 border-transparent
              transition-all duration-200">
              <span className="text-2xl">🎥</span>
              <span className="font-medium">화상 채팅</span>
            </button>
            
            <button className="flex items-center justify-center gap-2 p-4 bg-white rounded-xl
              hover:bg-green-50 hover:border-green-200 border-2 border-transparent
              transition-all duration-200">
              <span className="text-2xl">🤖</span>
              <span className="font-medium">챗봇 상담</span>
            </button>
            
            <button className="flex items-center justify-center gap-2 p-4 bg-white rounded-xl
              hover:bg-purple-50 hover:border-purple-200 border-2 border-transparent
              transition-all duration-200">
              <span className="text-2xl">👨‍⚕️</span>
              <span className="font-medium">전문가 매칭</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end mb-32">
        <button
          onClick={onSave}
          style={{
            backgroundColor: '#8B4513',
            color: '#FFFFFF',
            padding: '0.75rem 2rem',
            borderRadius: '0.75rem',
            fontWeight: '500',
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#654321';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#8B4513';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
          }}
        >
          갈등 카드 저장하기
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Step5AIAnalysis;
