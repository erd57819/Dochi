import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore';
import useComfortStore from '../stores/ComfortStore';
import todakImg from '../assets/todak.png';

const ComfortPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  const {
    sessions,
    loadChatRooms,
    loadSession,
    createNewSessionWithFirstMessage
  } = useComfortStore();

  // 비로그인 시 접근 차단
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // 데이터 초기 로드
  useEffect(() => {
    if (isLoggedIn) {
      loadChatRooms().catch(() => console.warn('채팅방 목록 로드 실패'));
    }
  }, [isLoggedIn, loadChatRooms]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg text-gray-600">로그인 페이지로 이동 중...</div>
      </div>
    );
  }

  // 첫 메시지로 새 채팅 시작
  const handleStartNewChat = async () => {
    if (!inputValue.trim()) return;

    try {
      await createNewSessionWithFirstMessage(inputValue.trim());
      navigate('/comfort/chat');
    } catch (error) {
      console.error('새 채팅 시작 실패:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStartNewChat();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-12 px-4">
      {/* 헤더 */}
      <div className="flex flex-col items-center mb-12">
        <img src={todakImg} alt="토닥토닥" className="w-24 h-24 mb-4"/>
        <h1 className="text-4xl font-bold text-orange-500 mb-2">참견도치</h1>
        <p className="text-lg text-gray-600 mb-2">
          어떤 갈등이 있으신가요? 편하게 이야기해보세요.
        </p>
        <p className="text-sm text-gray-500">
          최근 5개월 뒤의 대화방은 자동 삭제됩니다
        </p>
      </div>

      {/* 채팅 입력창 */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="예: 직장 상사와 갈등이 있어요. 어떻게 해결하면 좋을까요?"
            className="w-full px-6 py-4 pr-16 border-2 border-orange-200 rounded-2xl resize-none focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 text-lg"
            rows="3"
            style={{ minHeight: '80px' }}
          />
          <button
            onClick={handleStartNewChat}
            disabled={!inputValue.trim()}
            className="absolute bottom-4 right-4 p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <div className="text-center mt-3">
          <span className="text-sm text-gray-500">
            Enter로 전송 · Shift+Enter로 줄바꿈
          </span>
        </div>
      </div>
    </div>
  );
};

export default ComfortPage;