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
      selectedMode: 'NORMAL', // NORMAL, COMFORT_ONLY, TIMELINE, COMIC
      showTimeline: false,
      showManhwa: false,

      // 액션들
      createNewSession: async () => {
        try {
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const response = await comfortService.createChatRoom('새로운 대화');
          const chatRoomId = response.data;
          
          const newSession = {
            id: chatRoomId,
            sessionId: sessionId,
            title: '새로운 대화',
            messages: [{
              id: 1,
              sender: 'bot',
              content: '안녕하세요! 오늘 하루는 어떠셨나요? 편하게 이야기해주세요. 🤗',
              timestamp: new Date()
            }],
            createdAt: new Date()
          };
          
          set((state) => ({
            sessions: [...state.sessions, newSession],
            currentSessionId: sessionId,
            currentChatRoomId: chatRoomId,
            messages: newSession.messages,
            showTimeline: false,
            showManhwa: false
          }));
        } catch (error) {
          console.error('Failed to create new session:', error);
          set({ error: '새 대화를 생성하는데 실패했습니다.' });
        }
      },

      loadSession: async (chatRoomId) => {
        try {
          const { sessions } = get();
          const session = sessions.find(s => s.id === chatRoomId);
          if (session) {
            // 서버에서 메시지 데이터 가져오기
            const response = await comfortService.getMessages(chatRoomId);
            const serverMessages = response.data.map(msg => ({
              id: msg.id,
              sender: msg.senderType.toLowerCase(),
              content: msg.message,
              timestamp: new Date(msg.timestamp)
            }));
            
            set({
              currentSessionId: session.sessionId,
              currentChatRoomId: chatRoomId,
              messages: serverMessages,
              showTimeline: false,
              showManhwa: false
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
          
          if (sessions.length === 1) {
            return false; // 최소 하나의 세션은 유지
          }
          
          await comfortService.deleteChatRoom(chatRoomId);
          
          const filteredSessions = sessions.filter(s => s.id !== chatRoomId);
          const newState = { sessions: filteredSessions };
          
          if (currentChatRoomId === chatRoomId) {
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
          
          if (!currentSessionId || !currentChatRoomId) {
            throw new Error('세션이 설정되지 않았습니다.');
          }
          
          // 사용자 메시지 추가
          const userMessage = {
            id: Date.now(),
            sender: 'user',
            content: message,
            timestamp: new Date()
          };
          
          set({
            messages: [...messages, userMessage],
            isLoading: true
          });
          
          // AI 응답 요청
          const response = await comfortService.sendMessage(currentSessionId, message, selectedMode);
          
          const botMessage = {
            id: Date.now() + 1,
            sender: 'bot',
            content: response.data.message,
            timestamp: new Date(response.data.timestamp),
            mode: selectedMode
          };
          
          const updatedMessages = [...messages, userMessage, botMessage];
          
          // 세션 제목 업데이트
          const updatedSessions = sessions.map(session => 
            session.id === currentChatRoomId 
              ? { 
                  ...session, 
                  messages: updatedMessages,
                  title: updatedMessages.length === 2 
                    ? message.slice(0, 20) + '...' 
                    : session.title
                }
              : session
          );
          
          set({
            messages: updatedMessages,
            sessions: updatedSessions,
            isLoading: false,
            error: null
          });
          
        } catch (error) {
          console.error('Failed to send message:', error);
          set({ 
            isLoading: false, 
            error: '메시지 전송에 실패했습니다.' 
          });
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
          const updatedSessions = sessions.map(session => 
            session.id === sessionId 
              ? { ...session, title: newTitle }
              : session
          );
          
          set({ sessions: updatedSessions });
          
          // TODO: 서버에 제목 변경 API 호출 (현재는 로컬만 업데이트)
          // await comfortService.updateChatRoomTitle(sessionId, newTitle);
        } catch (error) {
          console.error('Failed to update session title:', error);
          set({ error: '제목 변경에 실패했습니다.' });
        }
      },

      // 세션 종료 (페이지 떠날 때 호출)
      exitCurrentSession: async () => {
        try {
          const { currentSessionId, currentChatRoomId } = get();
          if (currentSessionId && currentChatRoomId) {
            await comfortService.exitSession(currentSessionId, currentChatRoomId);
          }
        } catch (error) {
          console.error('Failed to exit session:', error);
        }
      },
      
      // 채팅방 목록 로드
      loadChatRooms: async () => {
        try {
          const response = await comfortService.getChatRooms();
          if (response && response.data) {
            const chatRooms = response.data.map(room => ({
              id: room.id,
              sessionId: `session_${room.id}`,
              title: room.title,
              messages: [],
              createdAt: new Date(room.createdAt)
            }));
            
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
      setShowTimeline: (show) => set({ showTimeline: show }),
      setShowManhwa: (show) => set({ showManhwa: show }),

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
        selectedMode: state.selectedMode
      }) // 일부 상태만 저장
    }
  )
);

export default useComfortStore;
