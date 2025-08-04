
import React, { useState, useEffect, useRef } from 'react';

const TodakTodakChatbot = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: '안녕하세요! 토닥토닥 AI입니다. 무엇이든 물어보세요!',
      timestamp: '지금'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messageEndRef = useRef(null);

  // 메시지 자동 스크롤
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 현재 시간 가져오기
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 메시지 전송
  const sendMessage = async () => {
    if (!message.trim()) return;

    // 사용자 메시지 추가
    const userMessage = { 
      role: 'user', 
      content: message,
      timestamp: getCurrentTime()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      // 백엔드 API 호출
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
        })
      });

      const data = await response.json();
      setLoading(false);
      
      // AI 응답 추가
      const assistantMessage = {
        role: 'assistant',
        content: data.message || '응답을 받지 못했습니다.',
        timestamp: getCurrentTime()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      setLoading(false);
      console.error('API 에러:', error);
      
      setMessages(prev => [...prev, {
        role: 'assistant', 
        content: '서버 연결에 문제가 있습니다.',
        timestamp: getCurrentTime()
      }]);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🦔</div>
            <h1 className="text-xl font-bold text-gray-800">참견도치</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-800">공지사항</a>
            <a href="#" className="hover:text-gray-800">로그인</a>
            <a href="#" className="hover:text-gray-800">회원가입</a>
            <a href="#" className="hover:text-gray-800">검증도치 가이드라인</a>
            <button className="text-lg">🔍</button>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 flex gap-4 h-[calc(100vh-80px)]">
        {/* 왼쪽 채팅 영역 */}
        <div className="flex-1 bg-white rounded-lg shadow-sm flex flex-col">
          {/* 채팅 헤더 */}
          <div className="bg-yellow-600 text-white px-4 py-3 rounded-t-lg">
            <h2 className="font-semibold">토닥토닥 챗봇</h2>
          </div>
          
          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start space-x-3 ${
                msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  msg.role === 'user' ? 'bg-blue-100' : 'bg-yellow-100'
                }`}>
                  {msg.role === 'user' ? '👤' : '🦔'}
                </div>
                <div className={`max-w-[70%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block px-4 py-2 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {msg.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-lg">
                  🦔
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-2xl text-gray-600">
                  답변을 생성하고 있습니다...
                </div>
              </div>
            )}
            <div ref={messageEndRef}></div>
          </div>

          {/* 입력 영역 */}
          <div className="border-t border-gray-100 p-4">
            {/* 제안 프롬프트 */}
            <div className="flex flex-wrap gap-2 mb-3">
              {['질문생성', '내용요약', '학습도우미', '번역하기'].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setMessage(prompt)}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-full hover:bg-yellow-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
            
            {/* 메시지 입력 */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="궁금한 내용을 물어보세요"
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100"
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim() || loading}
                className="px-6 py-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                전송
              </button>
            </div>
          </div>
        </div>

        {/* 오른쪽 패널 */}
        <div className="w-80 space-y-4">
          {/* 캐릭터 그리드 */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-2 gap-3">
              {['🦔', '🦔', '💡', '😴'].map((emoji, index) => (
                <div
                  key={index}
                  className="aspect-square bg-yellow-500 rounded-xl flex items-center justify-center text-3xl cursor-pointer hover:scale-105 transition-transform"
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>

          {/* 대화 로그 */}
          <div className="bg-white rounded-lg shadow-sm p-4 max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-3 text-gray-800">최근 대화</h3>
            <div className="space-y-3">
              <div className="border-b border-gray-100 pb-3">
                <div className="text-xs text-yellow-600 font-semibold mb-1">00:14</div>
                <p className="text-sm text-gray-700">클래식노트에 대해 질문했습니다.</p>
              </div>
              <div className="border-b border-gray-100 pb-3">
                <div className="text-xs text-yellow-600 font-semibold mb-1">01:19</div>
                <p className="text-sm text-gray-700">학습 방법에 대해 문의했습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodakTodakChatbot;