import React from 'react';
import { Link } from 'react-router-dom';

const VoiceDemoPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎤 음성인식 TTS 시스템 데모
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            참견도치 프로젝트의 음성 AI 기능을 체험해보세요
          </p>
        </div>

        {/* 기능 카드들 */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* 독립 음성 채팅 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎤</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">음성 채팅</h2>
              <p className="text-gray-600">AI와 음성으로 대화하고 응답을 들어보세요</p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                음성 인식 (STT)
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                AI 응답 생성
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                음성 합성 (TTS)
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                대화 기록 관리
              </div>
            </div>

            <Link
              to="/voice-chat"
              className="block w-full text-center py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              음성 채팅 시작하기
            </Link>
          </div>

          {/* 화상통화 + 음성 AI */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📹</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">화상통화 + AI</h2>
              <p className="text-gray-600">화상통화 중에 AI 어시스턴트와 대화하세요</p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                WebRTC 화상통화
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                실시간 음성 AI
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                대화 기록 패널
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                음성 재생 제어
              </div>
            </div>

            <Link
              to="/video-room/demo123"
              className="block w-full text-center py-3 px-6 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
            >
              화상통화 데모 참여
            </Link>
          </div>
        </div>

        {/* 시스템 정보 */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
            🛠️ 시스템 정보
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🎧</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">음성 인식</h4>
              <p className="text-sm text-gray-600">Google Speech Recognition API로 정확한 한국어 인식</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🤖</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">AI 응답</h4>
              <p className="text-sm text-gray-600">상황별 맞춤 응답 생성 및 대화 컨텍스트 관리</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🔊</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">음성 합성</h4>
              <p className="text-sm text-gray-600">Google TTS로 자연스러운 한국어 음성 생성</p>
            </div>
          </div>
        </div>

        {/* 사용 가이드 */}
        <div className="mt-8 bg-yellow-50 rounded-xl border border-yellow-200 p-6">
          <h4 className="text-lg font-semibold text-yellow-800 mb-4">
            📋 빠른 시작 가이드
          </h4>
          
          <div className="space-y-3 text-sm text-yellow-700">
            <div className="flex items-start">
              <span className="font-semibold mr-2">1.</span>
              <span>브라우저에서 마이크 권한을 허용해주세요</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold mr-2">2.</span>
              <span>🎤 버튼을 클릭하여 녹음을 시작하세요</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold mr-2">3.</span>
              <span>명확하게 말한 후 다시 🎤 버튼을 눌러 중지하세요</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold mr-2">4.</span>
              <span>AI가 자동으로 응답을 음성으로 재생합니다</span>
            </div>
          </div>
        </div>

        {/* 뒤로가기 */}
        <div className="text-center mt-8">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← 메인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VoiceDemoPage;