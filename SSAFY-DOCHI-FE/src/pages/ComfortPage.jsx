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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative" style={{ zoom: '0.85' }}>
        <div className="absolute inset-0">
          <div 
            className="absolute top-0 left-0 w-full" 
            style={{ 
              height: '100%',
              opacity: 0.14
            }}
          ></div>
        </div>
        <main className="max-w-5xl mx-auto px-3 py-4 relative z-10 flex items-center min-h-screen">
          <div className="flex justify-center w-full">
            <div className="bg-white rounded-xl p-12">
              <div className="text-center">
                <div className="text-xl" style={{ color: '#666666' }}>로그인 페이지로 이동 중...</div>
              </div>
            </div>
          </div>
        </main>
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative" style={{ zoom: '0.85' }}>
      {/* 전체 배경 컨테이너 */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-0 left-0 w-full" 
          style={{ 
            height: '100%',
            opacity: 0.14
          }}
        ></div>
      </div>
      
      {/* 메인 컨테이너 */}
      <main className="max-w-5xl mx-auto px-3 py-4 relative z-10 flex items-center min-h-screen">
        <div className="flex justify-center w-full">
          <div className="w-full max-w-4xl">
            <div className="bg-white rounded-xl p-12">
              
              {/* 상단 헤더 섹션 */}
              <div className="text-center mb-12">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <img 
                      src={todakImg} 
                      alt="참견도치" 
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                </div>
                <h1 className="text-4xl font-bold mb-3" style={{ color: '#8B4513' }}>참견도치</h1>
                <p className="text-xl mb-2" style={{ color: '#666666' }}>
                  AI 기반 갈등 해결 서비스
                </p>
                <p className="text-lg mb-2" style={{ color: '#666666' }}>
                  어떤 갈등이 있으신가요? 편하게 이야기해보세요.
                </p>
                <p className="text-sm" style={{ color: '#999999' }}>
                  최근 2시간 뒤의 대화방은 자동 삭제됩니다
                </p>
              </div>

              {/* 채팅 입력 섹션 */}
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="예: 직장 상사와 갈등이 있어요. 어떻게 해결하면 좋을까요?"
                    className="w-full px-0 py-6 bg-transparent border-0 border-b-2 focus:outline-none text-lg text-center resize-none transition-colors"
                    style={{ 
                      borderBottomColor: '#bf7d2c',
                      minHeight: '120px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderBottomColor = '#8B4513';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderBottomColor = '#bf7d2c';
                    }}
                    rows="4"
                  />
                  <button
                    onClick={handleStartNewChat}
                    disabled={!inputValue.trim()}
                    className="absolute bottom-2 right-2 p-3 text-white rounded-full transition-colors disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: !inputValue.trim() ? '#d1d5db' : '#bf7d2c'
                    }}
                    onMouseEnter={(e) => {
                      if (inputValue.trim()) {
                        e.target.style.backgroundColor = '#8B4513';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (inputValue.trim()) {
                        e.target.style.backgroundColor = '#bf7d2c';
                      }
                    }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <div className="text-center mt-6">
                  <span className="text-sm" style={{ color: '#999999' }}>
                    Enter로 전송 · Shift+Enter로 줄바꿈
                  </span>
                </div>
              </div>

              {/* 시작하기 버튼 */}
              <div className="flex justify-center mt-12">
                <button
                  onClick={handleStartNewChat}
                  disabled={!inputValue.trim()}
                  className="px-8 py-3 rounded-lg font-medium transition-colors text-base"
                  style={{ 
                    backgroundColor: !inputValue.trim() ? '#d1d5db' : '#bf7d2c',
                    color: 'white',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (inputValue.trim()) {
                      e.target.style.backgroundColor = '#8B4513';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (inputValue.trim()) {
                      e.target.style.backgroundColor = '#bf7d2c';
                    }
                  }}
                >
                  갈등 상담 시작하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ComfortPage;