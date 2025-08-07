import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore.js';
import useComfortStore from '../stores/ComfortStore.js';
import comfortService from '../services/comfortService.js';
import ChatTitleModal from '../components/ChatTitleModal.jsx';

const ComfortChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const messagesEndRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [showTitleModal, setShowTitleModal] = useState(false);
  
  const {
    sessions,
    currentSessionId,
    currentChatRoomId,
    messages,
    isLoading,
    error,
    isSidebarOpen,
    selectedMode,
    showTimeline,
    showManhwa,
    timelineCache,
    manhwaCache,
    createNewSession,
    createNewSessionWithTitle,
    loadSession,
    deleteSession,
    sendMessage,
    loadChatRooms,
    exitCurrentSession,
    setLoading,
    setError,
    toggleSidebar,
    setSelectedMode,
    setShowTimeline,
    setShowManhwa
  } = useComfortStore();

  useEffect(() => {
    // 채팅방 목록 로드 (에러 발생 시 무시)
    loadChatRooms().catch(() => {
      console.log('채팅방 목록 로드 실패, 새 세션 생성으로 진행');
    });
  }, []);

  useEffect(() => {
    // 세션이 없으면 ComfortPage로 리다이렉트
    const timer = setTimeout(() => {
      if (sessions.length === 0 && !currentSessionId) {
        console.log('세션이 없어 ComfortPage로 이동');
        navigate('/comfort');
      }
    }, 2000); // 2초 정도 여유시간을 줘서 로딩 완료 대기
    
    return () => clearTimeout(timer);
  }, [sessions, currentSessionId, navigate]);

  useEffect(() => {
    // 페이지 떠날 때 세션 종료
    const handleBeforeUnload = () => {
      exitCurrentSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      exitCurrentSession();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    try {
      console.log('메시지 전송:', { inputValue, selectedMode });
      await sendMessage(inputValue);
      setInputValue('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleDeleteSession = async (chatRoomId) => {
    const success = await deleteSession(chatRoomId);
    if (success) {
      // 삭제 후 남은 세션이 없으면 ComfortPage로
      const { sessions } = useComfortStore.getState();
      if (sessions.length === 0) {
        navigate('/comfort');
      }
    }
  };

  const handleCreateWithTitle = async (title) => {
    try {
      await createNewSessionWithTitle(title);
      setShowTitleModal(false);
    } catch (error) {
      console.error('Failed to create session with title:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 버튼 클릭 시 캐시를 먼저 확인하는 핸들러
  const handleTimelineButtonClick = () => {
    const { currentChatRoomId, timelineCache } = useComfortStore.getState();
    console.log('🎯 타임라인 버튼 클릭', { currentChatRoomId, hasCache: !!timelineCache[currentChatRoomId] });
    
    // 캐시가 있고, 내용이 비어있지 않은지 확인
    if (timelineCache[currentChatRoomId] && timelineCache[currentChatRoomId].length > 0) {
      console.log('✅ 타임라인 캐시 존재. 모달만 엽니다.');
      setShowTimeline(true);
    } else {
      console.log('🆕 타임라인 캐시 없음. 최초 생성을 요청합니다.');
      generateTimeline(); // 캐시 없으면 생성 함수 호출
    }
  };

  // 생성/새로고침 전용 함수 (forceRefresh 제거)
  const generateTimeline = async () => {
    console.log('🔄 타임라인 생성/새로고침 요청');
    try {
      const { currentChatRoomId, currentSessionId, messages } = useComfortStore.getState();

      if (!currentSessionId || !currentChatRoomId) {
        setError('세션이 설정되지 않았습니다.');
        return;
      }
      if (!messages || messages.length <= 1) {
        setError('대화 내용이 부족합니다.');
        return;
      }

      setLoading(true);
      setShowTimeline(true);

      const prompt = "타임라인을 생성해주세요";

      try {
        const response = await comfortService.sendMessage(currentSessionId, prompt, 'TIMELINE');
        const timelineText = response.data.message;
        const timelineData = parseTimelineResponse(timelineText);
        useComfortStore.getState().setTimelineCache(currentChatRoomId, timelineData);
        console.log('💾 타임라인 캐시 저장 완료');
      } catch (error) {
        console.error('❌ 타임라인 생성 API 오류:', error);
        const errorMessage = error.response?.data?.message || '타임라인 생성에 실패했습니다.';
        useComfortStore.getState().setTimelineCache(currentChatRoomId, [
          { time: '오류', content: errorMessage, color: 'red' }
        ]);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ 타임라인 생성 전체 오류:', error);
      setError('타임라인 생성 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const handleManhwaButtonClick = () => {
    const { currentChatRoomId, manhwaCache } = useComfortStore.getState();
    console.log('🎯 네컷만화 버튼 클릭', { currentChatRoomId, hasCache: !!manhwaCache[currentChatRoomId] });
    
    if (manhwaCache[currentChatRoomId] && manhwaCache[currentChatRoomId].length > 0) {
      console.log('✅ 네컷만화 캐시 존재. 모달만 엽니다.');
      setShowManhwa(true);
    } else {
      console.log('🆕 네컷만화 캐시 없음. 최초 생성을 요청합니다.');
      generateManhwa(); // 캐시 없으면 생성 함수 호출
    }
  };

  const generateManhwa = async () => {
    console.log('🔄 네컷만화 생성/새로고침 요청');
    try {
      const { currentChatRoomId, currentSessionId, messages } = useComfortStore.getState();

      if (!currentSessionId || !currentChatRoomId) {
        setError('세션이 설정되지 않았습니다.');
        return;
      }
      if (!messages || messages.length <= 1) {
        setError('대화 내용이 부족합니다.');
        return;
      }

      setLoading(true);
      setShowManhwa(true);

      const prompt = "네컷만화를 그려주세요";

      try {
        const response = await comfortService.sendMessage(currentSessionId, prompt, 'COMIC');
        const imageUrl = response.data.message;

        if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data:image'))) {
          const manhwaData = [{ type: 'image', url: imageUrl, title: '오늘의 네컷만화' }];
          useComfortStore.getState().setManhwaCache(currentChatRoomId, manhwaData);
          console.log('💾 네컷만화 캐시 저장 완료');
        } else {
          throw new Error("유효하지 않은 이미지 URL입니다.");
        }
      } catch (error) {
        console.error('❌ 네컷만화 생성 API 오류:', error);
        const errorMessage = error.response?.data?.message || '만화 생성에 실패했습니다.';
        useComfortStore.getState().setManhwaCache(currentChatRoomId, [
          { emoji: '❌', text: errorMessage, bg: 'bg-red-100' }
        ]);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ 네컷만화 생성 전체 오류:', error);
      setError('만화 생성 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // AI 응답을 타임라인 데이터로 파싱하는 함수
  const parseTimelineResponse = (text) => {
    // AI 응답을 타임라인 형태로 분석
    // 예: "1. 발단: 문제 제기\n2. 전개: 감정 표현\n3. 절정: 위로와 공감"
    const lines = text.split('\n').filter(line => line.trim());
    const timeline = [];
    
    lines.forEach((line, index) => {
      if (line.includes(':') || line.includes('.')) {
        const parts = line.split(/[:.]/);
        if (parts.length >= 2) {
          timeline.push({
            time: parts[0].trim(),
            content: parts.slice(1).join(':').trim(),
            color: ['orange', 'blue', 'green', 'purple'][index % 4]
          });
        }
      }
    });
    
    return timeline.length > 0 ? timeline : [
      { time: 'AI 분석 결과', content: text, color: 'blue' }
    ];
  };

  // 메시지 렌더링 (모드별 처리)
  const renderMessage = (message) => {
    // COMIC 모드에서 이미지 URL인 경우 이미지로 표시
    if (message.mode === 'COMIC' && message.content.startsWith('http')) {
      return (
        <img 
          src={message.content} 
          alt="AI 생성 만화" 
          className="max-w-md rounded-lg" 
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
      );
    }
    return <p className="whitespace-pre-wrap">{message.content}</p>;
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
      <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-transform duration-300 z-40 ${ isSidebarOpen ? 'translate-x-0' : '-translate-x-full' }`} style={{ width: '280px' }}>
        <div className="p-4 border-b">
          <button
            onClick={() => setShowTitleModal(true)}
            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 대화 시작하기
          </button>
        </div>
        
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 88px)', paddingTop: '20px' }}>
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${ currentChatRoomId === session.id ? 'bg-orange-50' : '' }`}
              onClick={() => loadSession(session.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 truncate mb-1">{session.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(session.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors ml-2"
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
      <div className={`flex-1 flex flex-col transition-all duration-300 ${ isSidebarOpen ? 'ml-[280px]' : 'ml-0' }`}>
        {/* 헤더 */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">토닥토닥 서비스</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handleManhwaButtonClick}
              disabled={isLoading}
              className={`px-4 py-2 text-white rounded-lg transition-colors text-sm flex items-center gap-2 ${ isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600' }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  생성중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  네컷만화
                </>
              )}
            </button>
            <button
              onClick={handleTimelineButtonClick}
              disabled={isLoading}
              className={`px-4 py-2 text-white rounded-lg transition-colors text-sm flex items-center gap-2 ${ isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600' }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  분석중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  타임라인
                </>
              )}
            </button>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="NORMAL">입장정리</option>
              <option value="COMFORT_ONLY">내편들기</option>
            </select>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}
          
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
                    <span className="text-sm text-gray-600">
                      {selectedMode === 'NORMAL' ? '정리도치' :
                       selectedMode === 'COMFORT_ONLY' ? '편들기도치' :
                       selectedMode === 'TIMELINE' ? '분석도치' : '그림도치'}
                    </span>
                  </div>
                )}
                <div className={`px-4 py-2 rounded-lg ${ message.sender === 'user' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-800'
                }`}>
                  {renderMessage(message)}
                  {message.mode === 'COMIC' && message.content.startsWith('http') && (
                    <p className="text-sm text-gray-600 mt-2" style={{ display: 'none' }}>
                      이미지를 불러올 수 없습니다: {message.content}
                    </p>
                  )}
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
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {selectedMode === 'COMIC' ? '만화를 그리고 있어요...' :
                     selectedMode === 'TIMELINE' ? '타임라인을 분석하고 있어요...' :
                     selectedMode === 'COMFORT_ONLY' ? '당신의 편에서 생각하고 있어요...' :
                     '입장을 정리하고 있어요...'}
                  </span>
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
              <div className="flex gap-2">
                <button 
                  onClick={generateTimeline}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                >
                  새로고침
                </button>
                <button onClick={() => setShowTimeline(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {(timelineCache[currentChatRoomId] || []).map((item, index) => (
                <div key={index} className={`border-l-4 border-${item.color}-500 pl-4`}>
                  <h4 className="font-medium">{item.time}</h4>
                  <p className="text-gray-600 text-sm mt-1">{item.content}</p>
                </div>
              ))}
              {(!timelineCache[currentChatRoomId] || timelineCache[currentChatRoomId].length === 0) && (
                <div className="text-center text-gray-500 py-8">
                  타임라인을 생성하고 있습니다...
                </div>
              )}
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
              <div className="flex gap-2">
                <button 
                  onClick={generateManhwa}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  새로고침
                </button>
                <button onClick={() => setShowManhwa(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(manhwaCache[currentChatRoomId] || []).map((panel, index) => {
                // 이미지 타입인 경우
                if (panel.type === 'image') {
                  return (
                    <div key={index} className="col-span-2">
                      <h4 className="text-center font-medium mb-2">{panel.title}</h4>
                      <img 
                        src={panel.url} 
                        alt="AI 생성 네컷만화" 
                        className="w-full rounded-lg" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <p className="text-center text-gray-500 text-sm mt-2" style={{ display: 'none' }}>
                        이미지를 불러올 수 없습니다
                      </p>
                    </div>
                  );
                }
                // 기존 이모지 타입
                return (
                  <div key={index} className={`${panel.bg} p-4 rounded-lg aspect-square flex items-center justify-center`}>
                    <div className="text-center">
                      <div className="text-4xl mb-2">{panel.emoji}</div>
                      <p className="text-sm">{panel.text}</p>
                    </div>
                  </div>
                );
              })}
              {(!manhwaCache[currentChatRoomId] || manhwaCache[currentChatRoomId].length === 0) && (
                <div className="col-span-2 text-center text-gray-500 py-8">
                  만화를 생성하고 있습니다...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 제목 입력 모달 */}
      <ChatTitleModal
        isOpen={showTitleModal}
        onClose={() => setShowTitleModal(false)}
        onConfirm={handleCreateWithTitle}
      />
    </div>
  );
};

export default ComfortChatPage;