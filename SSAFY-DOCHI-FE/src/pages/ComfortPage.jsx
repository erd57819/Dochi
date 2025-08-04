import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore.js';

const ComfortPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();

  const handleStartChat = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
      return;
    }
    navigate('/comfort/chat');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center p-4">
      {/* 메인 컨테이너 */}
      <div className="max-w-4xl mx-auto text-center">
        {/* 타이틀 섹션 */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-orange-500 mb-4 animate-pulse">
            토닥토닥
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            당신의 마음을 어루만져 드릴게요
          </p>
        </div>

        {/* 도치 캐릭터 이미지 섹션 */}
        <div className="mb-12 relative">
          <div className="w-64 h-64 mx-auto bg-orange-100 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
            <div className="text-8xl">🦔</div>
            {/* 말풍선 효과 */}
            <div className="absolute -top-8 -right-8 bg-white p-4 rounded-2xl shadow-md transform rotate-6">
              <p className="text-sm font-medium text-gray-700">
                오늘 하루는 어떠셨나요?
              </p>
            </div>
          </div>
        </div>

        {/* 설명 섹션 */}
        <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            이런 대화를 나눌 수 있어요
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl mb-2">💭</div>
              <h3 className="font-semibold text-lg mb-2">일상 대화</h3>
              <p className="text-gray-600 text-sm">
                하루의 크고 작은 이야기들을 편하게 나눠보세요
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl mb-2">🤗</div>
              <h3 className="font-semibold text-lg mb-2">감정 공유</h3>
              <p className="text-gray-600 text-sm">
                기쁨도, 슬픔도 함께 나누며 위로받아요
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-3xl mb-2">💪</div>
              <h3 className="font-semibold text-lg mb-2">응원과 격려</h3>
              <p className="text-gray-600 text-sm">
                힘든 순간에도 당신 곁에서 응원할게요
              </p>
            </div>
          </div>
        </div>

        {/* 시작 버튼 */}
        <button
          onClick={handleStartChat}
          className="group relative px-12 py-6 bg-orange-500 text-white text-xl font-bold rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all duration-300"
        >
          <span className="flex items-center gap-3">
            대화 시작하기
            <svg 
              className="w-6 h-6 group-hover:translate-x-2 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          </span>
          <div className="absolute inset-0 bg-orange-400 rounded-full blur-lg opacity-0 group-hover:opacity-30 transition-opacity"></div>
        </button>

        {/* 안내 메시지 */}
        <p className="mt-8 text-gray-500 text-sm">
          * 대화 내용은 안전하게 보호되며, 언제든지 삭제할 수 있습니다
        </p>
      </div>
    </div>
  );
};

export default ComfortPage;
