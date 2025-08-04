import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore.js';
import useComfortStore from '../stores/ComfortStore.js';
import comfortService from '../services/comfortService.js';

const ComfortChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const messagesEndRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  
  const {
    sessions,
    currentSessionId,
    messages,
    isLoading,
    isSidebarOpen,
    selectedModel,
    showTimeline,
    showManhwa,
    createNewSession,
    loadSession,
    deleteSession,
    addMessage,
    setLoading,
    toggleSidebar,
    setSelectedModel,
    setShowTimeline,
    setShowManhwa
  } = useComfortStore();

  useEffect(() => {
    // 초기 세션이 없으면 생성
    if (sessions.length === 0) {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    addMessage(userMessage);
    setInputValue('');
    setLoading(true);

    try {
      // 실제 API 호출 시 주석 해제
      // const response = await comfortService.sendMessage(currentSessionId, inputValue, selectedModel);
      // const botMessage = {
      //   id: Date.now() + 1,
      //   sender: 'bot',
      //   content: response.message,
      //   timestamp: new Date()
      // };
      
      // 임시 응답 (백엔드 연결 전)
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          content: getBotResponse(inputValue),
          timestamp: new Date()
        };
        
        addMessage(botMessage);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to send message:', error);
      setLoading(false);
      // 에러 처리
    }
  };

  const getBotResponse = (input) => {
    const responses = [
      "그런 일이 있으셨군요. 정말 힘드셨겠어요. 제가 옆에서 들어드릴게요.",
      "당신의 마음이 느껴져요. 오늘 하루도 수고 많으셨어요.",
      "그래도 이렇게 이야기를 나눌 수 있어서 다행이에요. 혼자가 아니라는 걸 기억해주세요.",
      "때로는 그저 누군가 들어주는 것만으로도 위로가 되죠. 계속 이야기해주세요.",
      "당신은 충분히 잘하고 있어요. 스스로를 너무 몰아세우지 마세요."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteSession = (sessionId) => {
    const success = deleteSession(sessionId);
    if (!success) {
      alert('최소 하나의 채팅방은 유지되어야 합니다.');
    }
  };

  const generateTimeline = async () => {
    try {
      // 실제 API 호출 시 주석 해제
      // const response = await comfortService.generateTimeline(currentSessionId);
      // 타임라인 데이터 처리
      setShowTimeline(true);
      setShowManhwa(false);
    } catch (error) {
      console.error('Failed to generate timeline:', error);
    }
  };

  const generateManhwa = async () => {
    try {
      // 실제 API 호출 시 주석 해제
      // const response = await comfortService.generateManhwa(currentSessionId);
      // 네컷만화 데이터 처리
      setShowManhwa(true);
      setShowTimeline(false);
    } catch (error) {
      console.error('Failed to generate manhwa:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 토글 버튼 */}
      <button
        onClick={toggleSidebar}
        className="fixed left-4 top-24 z-50 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 사이드바 */}
      <div className={`fixed left-0 top-20 h-full bg-white shadow-lg transition-transform duration-300 z-40 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`} style={{ width: '280px' }}>
        <div className="p-4 border-b">
          <button
            onClick={createNewSession}
            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 대화 시작하기
          </button>
        </div>
        
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                currentSessionId === session.id ? 'bg-orange-50' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <div onClick={() => loadSession(session.id)} className="flex-1">
                  <h3 className="font-medium text-gray-800 truncate">{session.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(session.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 메인 채팅 영역 */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarOpen ? 'ml-[280px]' : 'ml-0'
      }`}>
        {/* 헤더 */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">토닥토닥 서비스</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={generateManhwa}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              네컷만화
            </button>
            <button
              onClick={generateTimeline}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              타임라인
            </button>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="참견도치">참견도치</option>
              <option value="위로도치">위로도치</option>
              <option value="공감도치">공감도치</option>
            </select>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                {message.sender === 'bot' && (
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center mr-2">
                      🦔
                    </div>
                    <span className="text-sm text-gray-600">{selectedModel}</span>
                  </div>
                )}
                <div className={`px-4 py-2 rounded-lg ${
                  message.sender === 'user' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {message.content}
                </div>
                <span className="text-xs text-gray-500 mt-1 block">
                  {new Date(message.timestamp).toLocaleTimeString('ko-KR')}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="bg-white border-t p-4">
          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="마음을 편하게 이야기해주세요..."
              className="flex-1 px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows="1"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              전송
            </button>
          </div>
        </div>
      </div>

      {/* 타임라인 모달 */}
      {showTimeline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">대화 타임라인</h3>
              <button onClick={() => setShowTimeline(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {/* 타임라인 내용은 백엔드에서 받아올 예정 */}
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-medium">오늘의 시작</h4>
                <p className="text-gray-600 text-sm mt-1">힘든 하루의 시작을 털어놓으셨네요</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium">감정의 공유</h4>
                <p className="text-gray-600 text-sm mt-1">솔직한 마음을 표현해주셨어요</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium">위로와 공감</h4>
                <p className="text-gray-600 text-sm mt-1">함께 나누며 조금씩 나아지고 있어요</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 네컷만화 모달 */}
      {showManhwa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">오늘의 네컷만화</h3>
              <button onClick={() => setShowManhwa(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* 네컷만화 내용은 백엔드에서 받아올 예정 */}
              <div className="bg-orange-100 p-4 rounded-lg aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🦔</div>
                  <p className="text-sm">안녕하세요!</p>
                </div>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">💭</div>
                  <p className="text-sm">오늘 하루는 어떠셨나요?</p>
                </div>
              </div>
              <div className="bg-green-100 p-4 rounded-lg aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🤗</div>
                  <p className="text-sm">제가 들어드릴게요</p>
                </div>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">✨</div>
                  <p className="text-sm">함께라면 괜찮아요!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComfortChatPage;
