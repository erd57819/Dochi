import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import comfortService from '../services/comfortService.js';

const useComfortStore = create(
  persist(
    (set, get) => ({
      // 채팅 세션 상태
      sessions: [],
      currentSessionId: null,
      currentChatRoomId: null,
      messages: [],
      isLoading: false,
      error: null,

      // UI 상태
      isSidebarOpen: false,
      selectedMode: 'NORMAL', // 입장정리가 기본값
      showTimeline: false,
      showManhwa: false,
      showTutorial: false, // 튜토리얼 모달 상태 추가
      
      // 모달 콘텐츠 캐시
      timelineCache: {},
      manhwaCache: {},

      // 액션들
      // 이 함수는 이제 createNewSessionWithTitle을 호출하는 방식으로 단순화합니다.
      createNewSession: async () => {
        try {
          await get().createNewSessionWithTitle('새로운 대화');
        } catch (error) {
          console.error('Failed to create new session:', error);
          set({ error: '새 대화를 생성하는데 실패했습니다.' });
        }
      },

      // 첫 메시지로 새 세션 생성 (클로드 스타일)
      createNewSessionWithFirstMessage: async (firstMessage) => {
        try {
          // [수정] sessionId를 여기서 만들지 않습니다.
          const title = firstMessage.length > 30 ? firstMessage.slice(0, 30) + '...' : firstMessage;
          
          // 1. 백엔드에 채팅방 생성을 요청합니다.
          const response = await comfortService.createChatRoom(title);
          const chatRoomId = response.data;
          
          // 2. 채팅방 목록을 다시 로드하여, 방금 만든 방의 정확한 정보(sessionId 포함)를 서버로부터 가져옵니다.
          await get().loadChatRooms();
          
          // 3. 방금 만든 세션을 찾습니다.
          const newSession = get().sessions.find(s => s.id === chatRoomId);

          if (newSession) {
            // 4. 서버가 생성한 정확한 sessionId로 상태를 설정합니다.
            set({
              currentSessionId: newSession.sessionId,
              currentChatRoomId: newSession.id,
              messages: [], // 초기 봇 메시지 제거 - 사용자 메시지부터 시작
              selectedMode: 'NORMAL',
              showTimeline: false,
              showManhwa: false
            });

            // 5. 첫 메시지를 자동으로 전송
            await get().sendMessage(firstMessage);
            
            return { sessionId: newSession.sessionId, chatRoomId: newSession.id };
          }
        } catch (error) {
          console.error('Failed to create new session with first message:', error);
          set({ error: '새 대화를 생성하는데 실패했습니다.' });
        }
      },

      createNewSessionWithTitle: async (title) => {
        try {
          // [수정] sessionId를 여기서 만들지 않습니다.
          
          // 1. 백엔드에 채팅방 생성을 요청합니다.
          const response = await comfortService.createChatRoom(title);
          const chatRoomId = response.data;
          
          // 2. 채팅방 목록을 다시 로드하여 서버가 생성한 sessionId를 포함한 최신 정보를 가져옵니다.
          await get().loadChatRooms();
          
          // 3. 방금 만든 채팅방을 찾습니다.
          const newSession = get().sessions.find(s => s.id === chatRoomId);
          
          if (newSession) {
            // 4. 서버가 준 정확한 sessionId로 상태를 설정합니다.
            set({
              currentSessionId: newSession.sessionId,
              currentChatRoomId: chatRoomId,
              messages: [], // 초기 봇 메시지 제거
              selectedMode: 'NORMAL',
              showTimeline: false,
              showManhwa: false,
              error: null
            });
          }
          
          console.log('새 세션 생성 완료:', { sessionId: newSession?.sessionId, chatRoomId, title });
          return { sessionId: newSession?.sessionId, chatRoomId };
        } catch (error) {
          console.error('Failed to create new session with title:', error);
          set({ error: '새 대화를 생성하는데 실패했습니다.' });
          throw error;
        }
      },

      loadSession: async (chatRoomId) => {
        try {
          const { sessions } = get();
          const session = sessions.find(s => s.id === chatRoomId);
          if (session) {
            // 서버에서 메시지 데이터 가져오기 (sessionId도 함께 전달)
            const response = await comfortService.getMessages(chatRoomId, session.sessionId);
            const serverMessages = response.data.map(msg => {
              // 배열 형태의 timestamp를 Date 객체로 변환
              let timestamp;
              if (Array.isArray(msg.timestamp)) {
                const timeArray = msg.timestamp;
                timestamp = new Date(
                  timeArray[0], // 년
                  timeArray[1] - 1, // 월 (0부터 시작하므로 -1)
                  timeArray[2], // 일
                  timeArray[3] || 0, // 시
                  timeArray[4] || 0, // 분
                  timeArray[5] || 0  // 초
                );
              } else {
                timestamp = new Date(msg.timestamp);
              }
              
              return {
                id: msg.id,
                sender: msg.senderType.toLowerCase(),
                content: msg.message,
                timestamp: timestamp
              };
            });
            
            set({
              currentSessionId: session.sessionId,
              currentChatRoomId: chatRoomId,
              messages: serverMessages,
              selectedMode: 'NORMAL',
              showTimeline: false,
              showManhwa: false,
              isLoading: false, // 세션 변경 시 로딩 상태 초기화
              error: null // 에러 상태도 초기화
              // 캐시는 유지하여 기존 데이터 보존
            });
          }
        } catch (error) {
          console.error('Failed to load session:', error);
          set({ error: '대화를 불러오는데 실패했습니다.' });
        }
      },

      deleteSession: async (chatRoomId) => {
        try {
          const { sessions, currentChatRoomId } = get();
          
          // 최소 세션 유지 조건 제거!
          await comfortService.deleteChatRoom(chatRoomId);
          
          const filteredSessions = sessions.filter(s => s.id !== chatRoomId);
          const newState = { sessions: filteredSessions };
          
          // 마지막 세션을 삭제했으면 현재 세션 정보도 초기화
          if (filteredSessions.length === 0) {
            newState.currentSessionId = null;
            newState.currentChatRoomId = null;
            newState.messages = [];
          } else if (currentChatRoomId === chatRoomId) {
            const newCurrentSession = filteredSessions[filteredSessions.length - 1];
            newState.currentSessionId = newCurrentSession.sessionId;
            newState.currentChatRoomId = newCurrentSession.id;
            newState.messages = newCurrentSession.messages;
          }
          
          set(newState);
          return true;
        } catch (error) {
          console.error('Failed to delete session:', error);
          set({ error: '대화를 삭제하는데 실패했습니다.' });
          return false;
        }
      },

      sendMessage: async (message) => {
        try {
          const { currentSessionId, currentChatRoomId, selectedMode, messages, sessions } = get();
          
          console.log('ComfortStore sendMessage 호출:', { message, selectedMode, currentSessionId, currentChatRoomId });
          
          if (!currentSessionId || !currentChatRoomId) {
            throw new Error('세션이 설정되지 않았습니다.');
          }

          // 메시지 전송 시작 시점의 세션 정보 저장
          const originalSessionId = currentSessionId;
          const originalChatRoomId = currentChatRoomId;
          
          // 사용자 메시지 준비
          const userMessage = {
            id: Date.now(),
            sender: 'user',
            content: message,
            timestamp: new Date()
          };
          
          // 먼저 사용자 메시지만 추가하고 로딩 시작
          const messagesWithUser = [...messages, userMessage];
          
          set({
            messages: messagesWithUser,
            isLoading: true
          });
          
          console.log('API 호출 전:', { currentSessionId, message, selectedMode });
          // AI 응답 요청
          const response = await comfortService.sendMessage(originalSessionId, message, selectedMode);
          console.log('API 응답:', response.data);
          
          const botMessage = {
            id: Date.now() + 1,
            sender: 'bot',
            content: response.data.message,
            timestamp: new Date(response.data.timestamp),
            mode: selectedMode
          };
          
          // 사용자 메시지와 봇 메시지 모두 포함
          const finalMessages = [...messagesWithUser, botMessage];
          
          // API 응답 시점에서 현재 상태 다시 확인
          const currentState = get();
          const isStillOnSameSession = currentState.currentChatRoomId === originalChatRoomId;
          
          // 첫 번째 사용자 메시지로 제목 생성 (기존 메시지가 2개 이하일 때)
          const updatedSessions = currentState.sessions.map(session => {
            if (session.id === originalChatRoomId) {
              let newTitle = session.title;
              
              // '새로운 대화'이고 첫 번째 메시지인 경우 제목 생성
              if (session.title === '새로운 대화' && finalMessages.length <= 2) {
                newTitle = message.length > 20 ? message.slice(0, 20) + '...' : message;
                
                // 기존 updateSessionTitle 함수 활용해서 제목 업데이트
                setTimeout(() => {
                  get().updateSessionTitle(originalChatRoomId, newTitle);
                }, 100);
              }
              
              return { 
                ...session, 
                messages: finalMessages,
                title: newTitle
              };
            }
            return session;
          });
          
          // 현재 같은 세션에 있을 때만 화면 업데이트, 아니면 백그라운드에서만 세션 업데이트
          if (isStillOnSameSession) {
            set({
              messages: finalMessages,
              sessions: updatedSessions,
              isLoading: false,
              error: null
            });
          } else {
            // 다른 세션으로 이동했으면 현재 화면은 건드리지 않고 세션 데이터만 업데이트
            set({
              sessions: updatedSessions,
              isLoading: false,
              error: null
            });
          }
          
        } catch (error) {
          console.error('Failed to send message:', error);
          
          // 504 게이트웨이 타임아웃 에러 처리
          if (error.response?.status === 504) {
            set({ 
              isLoading: false, 
              error: '서버 응답 시간이 초과되었습니다. 만화 생성은 시간이 오래 걸릴 수 있습니다. 잠시 후 다시 시도해주세요.' 
            });
          } else {
            set({ 
              isLoading: false, 
              error: '메시지 전송에 실패했습니다.' 
            });
          }
        }
      },
      
      addMessage: (message) => {
        const { messages, sessions, currentChatRoomId } = get();
        const updatedMessages = [...messages, message];
        
        const updatedSessions = sessions.map(session => 
          session.id === currentChatRoomId 
            ? { 
                ...session, 
                messages: updatedMessages,
                title: message.sender === 'user' && updatedMessages.length === 2 
                  ? message.content.slice(0, 20) + '...' 
                  : session.title
              }
            : session
        );
        
        set({
          messages: updatedMessages,
          sessions: updatedSessions
        });
      },

      // 세션 제목 업데이트
      updateSessionTitle: async (sessionId, newTitle) => {
        try {
          const { sessions } = get();
          
          // 서버에 제목 변경 API 호출
          await comfortService.updateChatRoomTitle(sessionId, newTitle);
          
          // 로컬 상태 업데이트
          const updatedSessions = sessions.map(session => 
            session.id === sessionId 
              ? { ...session, title: newTitle }
              : session
          );
          
          set({ sessions: updatedSessions });
          
        } catch (error) {
          console.error('Failed to update session title:', error);
          set({ error: '제목 변경에 실패했습니다.' });
          throw error; // 에러를 다시 던져서 UI에서 처리할 수 있도록
        }
      },

      // 세션 종료 (페이지 떠날 때 호출)
      exitCurrentSession: async () => {
        try {
          const { currentSessionId, currentChatRoomId, messages } = get();
          
          // ID가 유효한지 확인
          if (currentSessionId && currentChatRoomId && currentSessionId.startsWith('session_')) {
            
            // ★★★ 추가된 핵심 로직 ★★★
            // 사용자가 보낸 메시지가 하나라도 있는지 확인
            const hasUserMessages = messages.some(msg => msg.sender === 'user');

            if (hasUserMessages) {
              console.log(`세션 종료 요청 (사용자 메시지 존재): sessionId=${currentSessionId}, chatRoomId=${currentChatRoomId}`);
              await comfortService.exitSession(currentSessionId, currentChatRoomId);
            } else {
              console.log('사용자 메시지가 없어 세션 종료 요청을 보내지 않습니다.');
            }

          } else {
            console.log('유효하지 않은 세션 정보로, 종료 요청을 보내지 않습니다.', { 
              sessionId: currentSessionId, 
              chatRoomId: currentChatRoomId 
            });
          }
        } catch (error) {
          console.error('세션 종료 중 에러가 발생했으나 무시합니다:', error);
        } 
      },
      
      // 채팅방 목록 로드
      loadChatRooms: async () => {
        try {
          const response = await comfortService.getChatRooms();
          if (response && response.data) {
            const chatRooms = response.data.map(room => {
              // 배열 형태의 날짜를 Date 객체로 변환
              const createdAtArray = room.createdAt;
              const createdAt = new Date(
                createdAtArray[0], // 년
                createdAtArray[1] - 1, // 월 (0부터 시작하므로 -1)
                createdAtArray[2], // 일
                createdAtArray[3], // 시
                createdAtArray[4], // 분
                createdAtArray[5]  // 초
              );
              
              return {
                id: room.id,
                sessionId: room.sessionId, // 서버에서 받은 sessionId 사용 (조립 안 함)
                title: room.title,
                messages: [],
                createdAt: createdAt
              };
            });
            
            set({ sessions: chatRooms, error: null });
          }
        } catch (error) {
          console.error('Failed to load chat rooms:', error);
          // 에러 발생 시 빈 배열로 설정 (새 세션 생성 가능하도록)
          set({ sessions: [], error: null });
          throw error; // 에러를 다시 던져서 useEffect에서 처리할 수 있도록
        }
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSelectedMode: (mode) => set({ selectedMode: mode }),
      setShowTimeline: (show) => {
        set({ showTimeline: show });
        // 모달을 닫을 때 로딩 상태 초기화
        if (!show) {
          set({ isLoading: false });
        }
      },
      setShowManhwa: (show) => {
        set({ showManhwa: show });
        // 모달을 닫을 때 로딩 상태 초기화
        if (!show) {
          set({ isLoading: false });
        }
      },
      
      // 튜토리얼 모달 제어
      setShowTutorial: (show) => set({ showTutorial: show }),
      
      // 첫 방문자 감지 및 튜토리얼 자동 표시
      checkFirstVisit: () => {
        const hasSeenTutorial = localStorage.getItem('dochi-tutorial-completed');
        if (!hasSeenTutorial) {
          set({ showTutorial: true });
        }
      },
      
      // 캐시 관리 함수들
      setTimelineCache: (chatRoomId, data) => set((state) => ({
        timelineCache: { ...state.timelineCache, [chatRoomId]: data }
      })),
      setManhwaCache: (chatRoomId, data) => set((state) => ({
        manhwaCache: { ...state.manhwaCache, [chatRoomId]: data }
      })),

      // 전체 상태 초기화
      reset: () => set({
        sessions: [],
        currentSessionId: null,
        currentChatRoomId: null,
        messages: [],
        isLoading: false,
        error: null,
        isSidebarOpen: false,
        selectedMode: 'NORMAL',
        showTimeline: false,
        showManhwa: false
      })
    }),
    {
      name: 'comfort-storage', // localStorage에 저장될 key
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
        currentChatRoomId: state.currentChatRoomId,
        messages: state.messages, // 메시지도 저장하여 새로고침 시 유지
        timelineCache: state.timelineCache, // 캐시 데이터 저장 추가
        manhwaCache: state.manhwaCache // 캐시 데이터 저장 추가
        // selectedMode: state.selectedMode
      }) // 일부 상태만 저장
    }
  )
);

export default useComfortStore;