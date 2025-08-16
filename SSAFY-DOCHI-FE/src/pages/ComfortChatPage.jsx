import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/AuthStore.js';
import useComfortStore from '../stores/ComfortStore.js';
import comfortService from '../services/comfortService.js';
import ChatTitleModal from '../components/ChatTitleModal.jsx';
import TutorialModal from '../components/TutorialModal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import todakImg from '../assets/todak.png';

const ComfortChatPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  const messagesEndRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
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
    showTutorial, // 튜토리얼 상태 추가
    timelineCache,
    manhwaCache,
    createNewSessionWithTitle,
    createNewSessionWithFirstMessage,
    loadSession,
    deleteSession,
    sendMessage,
    loadChatRooms,
    exitCurrentSession,
    updateSessionTitle,
    setLoading,
    setError,
    toggleSidebar,
    setSelectedMode,
    setShowTimeline,
    setShowManhwa,
    setShowTutorial, // 튜토리얼 제어 함수 추가
    checkFirstVisit // 첫 방문자 감지 함수 추가
  } = useComfortStore();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    loadChatRooms().catch(() => {
      console.log('채팅방 목록 로드 실패, 새 세션 생성으로 진행');
    });
    
    // 첫 방문자 감지 및 튜토리얼 자동 표시
    checkFirstVisit();
    
    // 갈등 데이터 자동 전송 확인
    checkConflictData();
  }, []);

  // 갈등 데이터 확인 및 자동 전송
  const checkConflictData = async () => {
    try {
      const conflictData = sessionStorage.getItem('comfortConflictData');
      if (conflictData) {
        const parsedData = JSON.parse(conflictData);
        
        if (parsedData.autoSend && parsedData.message) {
          // 항상 새로운 세션 생성하여 갈등 상담 시작
          await createNewSessionWithFirstMessage(parsedData.message);
          
          // 사용한 데이터 삭제
          sessionStorage.removeItem('comfortConflictData');
        }
      }
    } catch (error) {
      console.error('갈등 데이터 처리 중 오류:', error);
    }
  };

  useEffect(() => {
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
    if (messages && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">로그인 페이지로 이동 중...</div>
      </div>
    );
  }


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
      // 새 대화 생성 시 입력값 초기화 (시작 화면으로 전환되도록)
      setInputValue('');
    } catch (error) {
      console.error('Failed to create session with title:', error);
    }
  };

  // 빈 새 대화 생성 (시작 화면 표시용)
  const handleCreateEmptyChat = () => {
    // 입력값 초기화하고 현재 세션을 null로 설정하여 시작 화면 표시
    setInputValue('');
    useComfortStore.setState({ 
      currentSessionId: null, 
      messages: [],
      currentChatRoomId: null,
      isLoading: false, // 로딩 상태 초기화
      error: null // 에러 상태도 초기화
    });
  };

  // 제목 수정 핸들러 (인라인 편집)
  const handleStartEditTitle = (sessionId, currentTitle) => {
    setEditingTitleId(sessionId);
    setEditTitleValue(currentTitle);
  };

  const handleSaveTitle = async () => {
    if (!editTitleValue.trim()) return;
    
    try {
      await updateSessionTitle(editingTitleId, editTitleValue.trim());
      setEditingTitleId(null);
      setEditTitleValue('');
    } catch (error) {
      console.error('Failed to update title:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingTitleId(null);
    setEditTitleValue('');
  };

  const handleTitleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (messages.length === 0 && !currentSessionId) {
        handleStartNewChat();
      } else {
        handleSendMessage();
      }
    }
  };

  // 첫 메시지로 새 채팅 시작
  const handleStartNewChat = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageToSend = inputValue.trim();
    setInputValue(''); // 먼저 input 초기화

    try {
      // 세션 생성과 동시에 첫 메시지 전송 (중복 호출 제거)
      await createNewSessionWithFirstMessage(messageToSend);
    } catch (error) {
      console.error('새 채팅 시작 실패:', error);
    }
  };

  const handleSaveAndExit = async () => {
    try {
      await exitCurrentSession();
      navigate('/');
    } catch (error) {
      console.error('Failed to save and exit:', error);
    }
  };

  const handleTimelineButtonClick = () => {
    const { currentChatRoomId, timelineCache } = useComfortStore.getState();
    
    if (timelineCache[currentChatRoomId] && timelineCache[currentChatRoomId].length > 0) {
      setShowTimeline(true);
    } else {
      generateTimeline();
    }
  };

  const generateTimeline = async () => {
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

      // ✅ 현재 프론트엔드에 있는 대화 내용을 직접 백엔드에 전달
      const conversationHistory = messages
        .map(msg => `${msg.sender.toUpperCase()}: ${msg.content}`)
        .join('\n');
      
      const prompt = `다음 대화를 바탕으로 타임라인을 생성해주세요:\n\n${conversationHistory}`;

      try {
        const response = await comfortService.sendMessage(currentSessionId, prompt, 'TIMELINE');
        const timelineText = response.data.message;
        const timelineData = parseTimelineResponse(timelineText);
        useComfortStore.getState().setTimelineCache(currentChatRoomId, timelineData);
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

  const saveChatToDatabase = async () => {
    const { currentChatRoomId, currentSessionId, messages } = useComfortStore.getState();
    
    if (!currentSessionId || !currentChatRoomId || !messages || messages.length === 0) {
      alert('저장할 대화 내용이 없습니다.');
      return;
    }
    
    try {
      await saveToDatabase(currentChatRoomId, currentSessionId);
      alert('대화 내용이 성공적으로 저장되었습니다!');
      
      // 저장 후 Redis 캐시 정리
      useComfortStore.getState().clearCache();
    } catch (error) {
      console.error('대화 저장 실패:', error);
      alert('대화 저장에 실패했습니다.');
    }
  };

  const downloadManhwaImage = async () => {
    const { currentChatRoomId, manhwaCache } = useComfortStore.getState();
    
    if (!currentChatRoomId || !manhwaCache[currentChatRoomId]) {
      alert('다운로드할 만화가 없습니다.');
      return;
    }
    
    try {
      const manhwaData = manhwaCache[currentChatRoomId];
      const imagePanel = manhwaData.find(panel => panel.type === 'image');
      
      if (!imagePanel) {
        alert('다운로드할 이미지가 없습니다.');
        return;
      }
      
      // 이미지 다운로드
      const response = await fetch(imagePanel.url);
      const blob = await response.blob();
      
      // 다운로드 링크 생성
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `네컷만화_${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('네컷만화 이미지가 다운로드되었습니다!');
    } catch (error) {
      console.error('이미지 다운로드 실패:', error);
      alert('이미지 다운로드에 실패했습니다.');
    }
  };

  const handleManhwaButtonClick = () => {
    setShowManhwa(true);
  };

  const generateManhwa = async () => {
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

      // 최근 사용자 메시지들을 기반으로 만화 생성 프롬프트 구성
      const userMessages = messages.filter(msg => msg.sender === 'user').slice(-5); // 최근 5개 사용자 메시지
      const chatContext = userMessages.map(msg => msg.content).join(' ');
      const prompt = `다음 대화 내용을 바탕으로 네컷만화를 그려주세요: ${chatContext}`;

      try {
        const response = await comfortService.sendMessage(currentSessionId, prompt, 'COMIC');
        console.log('🎨 네컷만화 API 응답:', response);
        
        let imageUrl = response.data.message;
        
        // 응답이 문자열이 아닌 경우 처리
        if (typeof imageUrl === 'object') {
          imageUrl = imageUrl.url || imageUrl.imageUrl || imageUrl.src || '';
        }
        
        // 문자열로 변환 후 공백 제거
        imageUrl = String(imageUrl || '').trim();
        
        console.log('🔍 처리된 이미지 URL:', imageUrl);

        // 더 유연한 URL 검증 로직
        const isValidUrl = imageUrl && (
          imageUrl.startsWith('http://') || 
          imageUrl.startsWith('https://') || 
          imageUrl.startsWith('data:image/') ||
          imageUrl.startsWith('/') || // 상대 경로
          imageUrl.includes('amazonaws.com') || // AWS S3
          imageUrl.includes('cloudfront.net') || // CloudFront CDN
          imageUrl.includes('.jpg') || 
          imageUrl.includes('.jpeg') || 
          imageUrl.includes('.png') || 
          imageUrl.includes('.gif') || 
          imageUrl.includes('.webp')
        );

        if (isValidUrl) {
          // 백엔드에서 받은 description 사용 (없으면 기본값)
          const description = response.data.description || '당신의 이야기를 4컷 만화로 표현했어요';
          const manhwaData = [{ 
            type: 'image', 
            url: imageUrl, 
            title: '오늘의 네컷만화',
            description: description
          }];
          useComfortStore.getState().setManhwaCache(currentChatRoomId, manhwaData);
        } else {
          console.error('❌ 유효하지 않은 이미지 URL:', imageUrl);
          throw new Error(`유효하지 않은 이미지 URL입니다: ${imageUrl}`);
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

  const parseTimelineResponse = (text) => {
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

  const renderMessage = (message) => {
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

  // 새 대화 시작 상태인지 확인
  const isNewChatMode = !currentSessionId || (messages && messages.length === 0);

  return (
    <div className="relative bg-gradient-to-br from-orange-50 via-white to-yellow-50 overflow-hidden flex"
         style={{ height: 'calc(100vh - 80px)' }}>
      {/* 배경 오버레이 */}
      <div className="absolute inset-0" style={{ opacity: 0.3 }}>
        <div 
          className="absolute top-0 left-0 w-full h-full"
          style={{ 
            background: 'linear-gradient(to bottom, rgb(248, 214, 179), white)',
            opacity: 0.5
          }}
        ></div>
      </div>
      
      {/* 사이드바 */}
      <div className={`bg-white shadow-lg transition-all duration-300 z-40 flex flex-col ${
        isSidebarOpen ? 'w-[280px]' : 'w-[70px]'
      }`} style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        height: 'calc(100vh - 80px)'
      }}>
        {/* 사이드바 토글 버튼 */}
        <div className="p-3 flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className={`w-full flex items-center justify-center p-2 rounded-full transition-colors ${
              !isSidebarOpen ? 'w-8 h-8' : 'w-full h-10'
            }`}
            style={{ 
              backgroundColor: 'transparent',
              color: '#8B4513'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            {isSidebarOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* 새 대화 버튼 */}
        {isSidebarOpen && (
          <div className="px-3 pb-4 flex-shrink-0">
            <button
              onClick={handleCreateEmptyChat}
              className="w-full px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm border"
              style={{ 
                backgroundColor: 'transparent',
                borderColor: '#bf7d2c',
                color: '#8B4513'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#bf7d2c';
                e.target.style.color = 'white';
                e.target.style.borderColor = '#bf7d2c';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#8B4513';
                e.target.style.borderColor = '#bf7d2c';
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 대화
            </button>
          </div>
        )}

        {/* 세션 목록 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
          {isSidebarOpen ? (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 cursor-pointer transition-colors mb-2 group ${
                  currentChatRoomId === session.id ? 'rounded-lg' : ''
                }`}
                style={{ 
                  backgroundColor: currentChatRoomId === session.id ? '#f8d6b3' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (currentChatRoomId !== session.id) {
                    e.target.style.backgroundColor = '#f9f9f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentChatRoomId !== session.id) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
                onClick={() => {
                  loadSession(session.id);
                  setInputValue(''); // 세션 전환 시 입력값 초기화
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0 pr-2">
                    {editingTitleId === session.id ? (
                      // 인라인 편집 모드
                      <div className="flex items-center gap-1 mb-1">
                        <input
                          type="text"
                          value={editTitleValue}
                          onChange={(e) => setEditTitleValue(e.target.value)}
                          onKeyPress={handleTitleKeyPress}
                          onBlur={handleSaveTitle}
                          className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                          autoFocus
                          maxLength={50}
                        />
                        <button
                          onClick={handleSaveTitle}
                          className="p-1 text-green-600 hover:text-green-700"
                          title="저장"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          title="취소"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      // 일반 제목 보기 모드
                      <div className="flex items-center gap-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate text-base flex-1 min-w-0" 
                            style={{ 
                              maxWidth: '180px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>{session.title}</h3>
                        {currentChatRoomId === session.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditTitle(session.id, session.title);
                            }}
                            className="p-1 transition-colors opacity-0 group-hover:opacity-100"
                            style={{ color: '#8B4513' }}
                            onMouseEnter={(e) => {
                              e.target.style.color = '#bf7d2c';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.color = '#8B4513';
                            }}
                            title="제목 수정"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-2 truncate" style={{ maxWidth: '180px' }}>
                      {new Date(session.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            sessions.slice(0, 5).map((session, index) => {
              return (
                <div
                  key={session.id}
                  className={`p-3 cursor-pointer transition-colors flex items-center justify-center mb-2 ${
                    currentChatRoomId === session.id ? 'rounded-lg' : ''
                  }`}
                  style={{ 
                    backgroundColor: currentChatRoomId === session.id ? '#f8d6b3' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (currentChatRoomId !== session.id) {
                      e.target.style.backgroundColor = '#f9f9f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentChatRoomId !== session.id) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                  onClick={() => {
                  loadSession(session.id);
                  setInputValue(''); // 세션 전환 시 입력값 초기화
                }}
                  title={session.title}
                >
                  <div 
                    className="text-sm font-medium truncate px-1" 
                    style={{ 
                      color: '#8B4513',
                      maxWidth: '100%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {session.title}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex-1 overflow-hidden relative"
           style={{ height: 'calc(100vh - 80px)' }}>
        
        {isNewChatMode ? (
          // 새 대화 시작 화면 - 로그인 페이지 스타일
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-yellow-50" style={{ zoom: '0.85' }}>
            <div className="w-full max-w-4xl px-3 py-4">
              <div className="bg-white rounded-xl p-12">
                
                {/* 로고 및 서비스 소개 */}
                <div className="text-center mb-12 w-full">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <img 
                        src={todakImg} 
                        alt="참견도치" 
                        className="w-50 h-50 object-contain"
                      />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-black mb-2">토닥토닥 챗봇</h2>
                  <p className="text-lg text-[#666] mb-6">갈등 상황이나 고민을 자세히 입력해 주시면 참견도치가 다양한 모드로 도와드립니다</p>
                </div>

                {/* 입력 폼 */}
                <div className="space-y-6 mb-8">
                  {/* 갈등 상황 입력 */}
                  <div>
                    <div className="flex justify-center">
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full max-w-2xl px-0 py-0 bg-transparent border-0 border-b-2 border-b-gray-300 focus:border-b-[#bf7d2c] focus:outline-none text-base transition-colors text-center resize-none"
                        placeholder="이야기를 자세히 들려주세요..."
                        style={{ 
                          minHeight: '30px',
                          fontFamily: 'inherit',
                          paddingBottom: '2px'
                        }}
                        rows="1"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
                
                {/* 하단 버튼 및 안내 - 전체 페이지 폭 기준 */}
                <div className="mt-6 relative w-full">
                  {/* 안내 메시지 */}
                  <div className="flex justify-center mb-4">
                    <div className="text-sm text-gray-500">
                      Enter로 전송 · Shift+Enter로 줄바꿈
                    </div>
                  </div>
                  
                  {/* 상담 시작 버튼 - 전체 페이지 가운데 */}
                  <div className="flex justify-center mb-4">
                    <button
                      onClick={handleStartNewChat}
                      disabled={!inputValue.trim() || isLoading}
                      className="px-8 py-3 rounded-lg font-medium transition-colors text-base"
                      style={{ 
                        backgroundColor: (!inputValue.trim() || isLoading) ? '#f3f4f6' : '#bf7d2c',
                        color: (!inputValue.trim() || isLoading) ? '#9ca3af' : 'white',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (inputValue.trim() && !isLoading) {
                          e.target.style.backgroundColor = '#8B4513';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (inputValue.trim() && !isLoading) {
                          e.target.style.backgroundColor = '#bf7d2c';
                        }
                      }}
                    >
                      {isLoading ? (
                        <LoadingSpinner size="small" text="대화 시작 중..." color="white" />
                      ) : (
                        '상담 시작하기'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 기존 채팅 화면
          <>
        {/* 채팅 도구바 */}
        {!showTutorial && !showTimeline && !showManhwa && !showTitleModal &&(
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0 shadow-sm" 
             style={{ 
               backgroundColor: 'rgba(255, 255, 255, 0.95)',
               backdropFilter: 'blur(10px)',
               padding: '12px 24px',
               position: 'absolute',
               top: '0',
               left: '0',
               right: '0',
               zIndex: 1000
             }}>
          {/* 커스텀 드롭다운 */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none border"
              style={{ 
                backgroundColor: 'transparent',
                borderColor: '#bf7d2c',
                color: '#8B4513',
                minWidth: '140px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#fefaf5';
                e.target.style.borderColor = '#8B4513';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.borderColor = '#bf7d2c';
              }}
            >
              <span>{selectedMode === 'NORMAL' ? '입장정리' : '내편들기'}</span>
              <svg 
                className={`w-4 h-4 ml-2 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24"
                style={{ stroke: '#8B4513' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div 
                className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg border overflow-hidden"
                style={{ 
                  borderColor: '#bf7d2c',
                  animation: 'fadeIn 0.15s ease-out',
                  zIndex: 1001
                }}
              >
                <div
                  onClick={() => {
                    setSelectedMode('NORMAL');
                    setIsDropdownOpen(false);
                  }}
                  className={`px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-gray-50 flex items-center ${
                    selectedMode === 'NORMAL' ? 'font-medium' : ''
                  }`}
                  style={{
                    color: selectedMode === 'NORMAL' ? '#bf7d2c' : '#374151'
                  }}
                >
                  <span>입장정리</span>
                  {selectedMode === 'NORMAL' && (
                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div
                  onClick={() => {
                    setSelectedMode('COMFORT_ONLY');
                    setIsDropdownOpen(false);
                  }}
                  className={`px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-gray-50 flex items-center ${
                    selectedMode === 'COMFORT_ONLY' ? 'font-medium' : ''
                  }`}
                  style={{
                    color: selectedMode === 'COMFORT_ONLY' ? '#bf7d2c' : '#374151'
                  }}
                >
                  <span>내편들기</span>
                  {selectedMode === 'COMFORT_ONLY' && (
                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            {/* 네컷만화 버튼 */}
            <button
              onClick={handleManhwaButtonClick}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 text-sm flex items-center gap-2 border ${
                isLoading ? 'cursor-not-allowed' : ''
              }`}
              style={{
                backgroundColor: isLoading ? 'transparent' : 'transparent',
                borderColor: isLoading ? '#d1d5db' : '#8B4513',
                color: isLoading ? '#d1d5db' : '#8B4513'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = '#8B4513';
                  e.target.style.color = 'white';
                  e.target.style.borderColor = '#8B4513';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#8B4513';
                  e.target.style.borderColor = '#8B4513';
                }
              }}
            >
              {isLoading ? (
                <LoadingSpinner size="small" text="생성중..." />
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  네컷만화
                </>
              )}
            </button>

            {/* 타임라인 버튼 */}
            <button
              onClick={handleTimelineButtonClick}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 text-sm flex items-center gap-2 border ${
                isLoading ? 'cursor-not-allowed' : ''
              }`}
              style={{
                backgroundColor: isLoading ? 'transparent' : 'transparent',
                borderColor: isLoading ? '#d1d5db' : '#bf7d2c',
                color: isLoading ? '#d1d5db' : '#bf7d2c'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = '#bf7d2c';
                  e.target.style.color = 'white';
                  e.target.style.borderColor = '#bf7d2c';
                  const svg = e.target.querySelector('svg');
                  if (svg) svg.style.stroke = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#bf7d2c';
                  e.target.style.borderColor = '#bf7d2c';
                  const svg = e.target.querySelector('svg');
                  if (svg) svg.style.stroke = '#bf7d2c';
                }
              }}
            >
              {isLoading ? (
                <LoadingSpinner size="small" text="분석중..." />
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" style={{ stroke: '#bf7d2c' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  타임라인
                </>
              )}
            </button>

            {/* 도움말 버튼 */}
            <button
              onClick={() => {
                // 다른 모달들 닫기
                setShowTimeline(false);
                setShowManhwa(false);
                setShowTitleModal(false);
                // 튜토리얼 열기
                setShowTutorial(true);
              }}
              className="px-3 py-1.5 rounded-lg transition-all duration-200 text-sm flex items-center gap-2 border"
              style={{ 
                backgroundColor: 'transparent',
                borderColor: '#8B4513',
                color: '#8B4513'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#8B4513';
                e.target.style.color = 'white';
                e.target.style.borderColor = '#8B4513';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#8B4513';
                e.target.style.borderColor = '#8B4513';
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              도움말
            </button>

            {/* 저장 후 종료 버튼 */}
            <button
              onClick={handleSaveAndExit}
              title="저장하지 않으면 대화가 사라져요"
              className="px-3 py-1.5 rounded-lg transition-all duration-200 text-sm flex items-center gap-2 border"
              style={{ 
                backgroundColor: 'transparent',
                borderColor: '#bf7d2c',
                color: '#bf7d2c'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#bf7d2c';
                e.target.style.color = 'white';
                e.target.style.borderColor = '#bf7d2c';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#bf7d2c';
                e.target.style.borderColor = '#bf7d2c';
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              저장 후 종료
            </button>
          </div>
        </div>
        )}

        {/* 메시지 영역 */}
        <div className="relative"
             style={{ 
               backgroundColor: 'rgba(254, 254, 254, 0.8)',
               backdropFilter: 'blur(5px)',
               overflow: messages.length > 0 ? 'auto' : 'hidden',
               padding: '8px',
               paddingTop: '80px', // 도구창 높이 고려해서 증가
               paddingBottom: '80px',
               height: 'calc(100vh - 160px)',
               maxHeight: 'calc(100vh - 160px)'
             }}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg shadow-sm">
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
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2" style={{ backgroundColor: '#f8d6b3' }}>
                      🦔
                    </div>
                    <span className="text-sm text-gray-600">
                      {selectedMode === 'NORMAL' ? '정리도치' :
                       selectedMode === 'COMFORT_ONLY' ? '내편도치' :
                       selectedMode === 'TIMELINE' ? '분석도치' : '그림도치'}
                    </span>
                  </div>
                )}
                <div className={`px-4 py-2 rounded-lg ${
                  message.sender === 'user' 
                    ? 'text-white shadow-lg' 
                    : 'text-gray-800 shadow-lg'
                }`}
                  style={message.sender === 'user' 
                    ? { 
                        backgroundColor: '#bf7d2c',
                        boxShadow: '0 4px 12px rgba(191, 125, 44, 0.3)'
                      } 
                    : { 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)'
                      }}>
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
              <div className="rounded-lg px-4 py-2 shadow-lg" 
                   style={{ 
                     backgroundColor: 'rgba(255, 255, 255, 0.95)',
                     backdropFilter: 'blur(10px)'
                   }}>
                <LoadingSpinner 
                  type="dots" 
                  size="small" 
                  color="#8B4513"
                  text={
                    selectedMode === 'COMIC' ? '만화를 그리고 있어요...' :
                    selectedMode === 'TIMELINE' ? '타임라인을 분석하고 있어요...' :
                    selectedMode === 'COMFORT_ONLY' ? '당신의 편에서 생각하고 있어요...' :
                    '입장을 정리하고 있어요...'
                  }
                />
              </div>
            </div>
          )}
          {messages.length > 0 && <div ref={messagesEndRef} />}
        </div>

        {/* 입력 영역 */}
        {!showTutorial && (
        <div className="border-t" 
             style={{ 
               backgroundColor: 'rgba(255, 255, 255, 0.98)',
               backdropFilter: 'blur(10px)',
               borderColor: 'rgba(191, 125, 44, 0.1)',
               padding: '12px',
               position: 'absolute',
               bottom: '0',
               left: '0',
               right: '0',
               zIndex: 1000
             }}>
          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="갈등 상황을 자세히 이야기해주세요..."
              className="flex-1 px-4 py-2 rounded-lg resize-none focus:outline-none bg-white shadow-sm"
              style={{ 
                border: 'none'
              }}
              rows="1"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-2 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              style={{
                backgroundColor: (!inputValue.trim() || isLoading) ? '#d1d5db' : '#bf7d2c'
              }}
              onMouseEnter={(e) => {
                if (inputValue.trim() && !isLoading) {
                  e.target.style.backgroundColor = '#8B4513';
                }
              }}
              onMouseLeave={(e) => {
                if (inputValue.trim() && !isLoading) {
                  e.target.style.backgroundColor = '#bf7d2c';
                }
              }}
            >
              전송
            </button>
          </div>
        </div>
        )}
        </>
        )}
      </div>

      {/* 타임라인 모달 */}
      {showTimeline && !showTutorial && !showManhwa && !showTitleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1200]" style={{ backdropFilter: 'blur(5px)' }}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl" 
               style={{ 
                 backgroundColor: 'rgba(255, 255, 255, 0.98)',
                 backdropFilter: 'blur(20px)'
               }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">갈등 타임라인</h3>
              <div className="flex gap-2">
                <button
                  onClick={generateTimeline}
                  className="px-3 py-1 text-white text-sm rounded transition-colors"
                  style={{ backgroundColor: '#bf7d2c' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#8B4513';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#bf7d2c';
                  }}
                >
                  새로고침
                </button>
                <button
                  onClick={() => saveChatToDatabase()}
                  className="px-3 py-1 text-white text-sm rounded transition-colors"
                  style={{ backgroundColor: '#10B981' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#059669';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#10B981';
                  }}
                >
                  대화저장
                </button>
                <button onClick={() => setShowTimeline(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {(timelineCache[currentChatRoomId] || []).map((item, index) => (
                <div key={index} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 mb-1">{item.time}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{item.content}</p>
                    </div>
                  </div>
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
      {showManhwa && !showTutorial && !showTimeline && !showTitleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1200]" style={{ backdropFilter: 'blur(5px)' }}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl" 
               style={{ 
                 backgroundColor: 'rgba(255, 255, 255, 0.98)',
                 backdropFilter: 'blur(20px)'
               }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">오늘의 네컷만화</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadManhwaImage()}
                  className="px-3 py-1 text-white text-sm rounded transition-colors"
                  style={{ backgroundColor: '#3B82F6' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#2563EB';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#3B82F6';
                  }}
                >
                  다운로드
                </button>
                <button onClick={() => setShowManhwa(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {manhwaCache[currentChatRoomId] && manhwaCache[currentChatRoomId].length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {manhwaCache[currentChatRoomId].map((panel, index) => {
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
                        {panel.description && (
                          <p className="text-center text-gray-600 text-sm mt-3 px-4 py-2 bg-gray-50 rounded-lg">
                            {panel.description}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div key={index} className={`${panel.bg} p-4 rounded-lg aspect-square flex items-center justify-center`}>
                      <div className="text-center">
                        <div className="text-4xl mb-2">{panel.emoji}</div>
                        <p className="text-sm">{panel.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div className="col-span-2 flex justify-center mt-4">
                  <button
                    onClick={generateManhwa}
                    disabled={isLoading}
                    className="px-6 py-2 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: isLoading ? '#d1d5db' : '#bf7d2c'
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.target.style.backgroundColor = '#8B4513';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.target.style.backgroundColor = '#bf7d2c';
                      }
                    }}
                  >
                    {isLoading ? <LoadingSpinner size="small" text="생성중..." color="white" /> : '다시 생성하기'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎨</div>
                <h4 className="text-lg font-medium mb-2">네컷만화 생성</h4>
                <p className="text-gray-600 mb-6">대화 내용을 바탕으로 재미있는 네컷만화를 만들어드려요!</p>
                <button
                  onClick={generateManhwa}
                  disabled={isLoading}
                  className="px-6 py-3 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isLoading ? '#d1d5db' : '#bf7d2c'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.target.style.backgroundColor = '#8B4513';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.target.style.backgroundColor = '#bf7d2c';
                    }
                  }}
                >
                  {isLoading ? (
                    <LoadingSpinner size="small" text="생성중..." color="white" />
                  ) : (
                    '네컷만화 생성하기'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ChatTitleModal
        isOpen={showTitleModal && !showTutorial && !showTimeline && !showManhwa}
        onClose={() => setShowTitleModal(false)}
        onConfirm={handleCreateWithTitle}
        mode="create"
      />
      
      <TutorialModal
        isOpen={showTutorial}
        onClose={() => {
          setShowTutorial(false);
          // 첫 방문자인 경우에만 ChatTitleModal 표시
          const hasSeenTutorial = localStorage.getItem('dochi-tutorial-completed');
          if (!hasSeenTutorial) {
            localStorage.setItem('dochi-tutorial-completed', 'true');
            setShowTitleModal(true);
          }
        }}
      />
    </div>
  );
};

export default ComfortChatPage;