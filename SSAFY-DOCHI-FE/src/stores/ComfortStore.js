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
      
      // 모달 콘텐츠 캐시
      timelineCache: {},
      manhwaCache: {},

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
            sessions: [newSession, ...state.sessions], // 새 대화방을 맨 위로
            currentSessionId: sessionId,
            currentChatRoomId: chatRoomId,
            messages: newSession.messages,
            selectedMode:'NORMAL',
            showTimeline: false,
            showManhwa: false
            // 캐시는 유지하여 기존 데이터 보존
          }));
        } catch (error) {
          console.error('Failed to create new session:', error);
          set({ error: '새 대화를 생성하는데 실패했습니다.' });
        }
      },

      // 제목으로 새 세션 생성
      createNewSessionWithTitle: async (title) => {
        try {
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const response = await comfortService.createChatRoom(title);
          const chatRoomId = response.data;
          
          const newSession = {
            id: chatRoomId,
            sessionId: sessionId,
            title: title,
            messages: [{
              id: 1,
              sender: 'bot',
              content: `${title}에 대해 이야기해주세요. 제가 어떻게 도움을 드릴 수 있을까요? 🤗`,
              timestamp: new Date()
            }],
            createdAt: new Date()
          };
          
          set((state) => ({
            sessions: [newSession, ...state.sessions], // 새 대화방을 맨 위로
            currentSessionId: sessionId,
            currentChatRoomId: chatRoomId,
            messages: newSession.messages,
            selectedMode: 'NORMAL',
            showTimeline: false,
            showManhwa: false
            // 캐시는 유지하여 기존 데이터 보존
          }));
        } catch (error) {
          console.error('Failed to create new session with title:', error);
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
              showManhwa: false
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
          
          console.log('ComfortStore sendMessage 호출:', { message, selectedMode, currentSessionId, currentChatRoomId });
          
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
          
          console.log('API 호출 전:', { currentSessionId, message, selectedMode });
          // AI 응답 요청
          const response = await comfortService.sendMessage(currentSessionId, message, selectedMode);
          console.log('API 응답:', response.data);
          
          const botMessage = {
            id: Date.now() + 1,
            sender: 'bot',
            content: response.data.message,
            timestamp: new Date(response.data.timestamp),
            mode: selectedMode
          };
          
          const updatedMessages = [...messages, userMessage, botMessage];
          
          // 첫 번째 사용자 메시지로 제목 생성 (기존 메시지가 2개 이하일 때)
          const updatedSessions = sessions.map(session => {
            if (session.id === currentChatRoomId) {
              let newTitle = session.title;
              
              // '새로운 대화'이고 첫 번째 메시지인 경우 제목 생성
              if (session.title === '새로운 대화' && updatedMessages.length <= 2) {
                newTitle = message.length > 20 ? message.slice(0, 20) + '...' : message;
                
                // 기존 updateSessionTitle 함수 활용해서 제목 업데이트
                setTimeout(() => {
                  get().updateSessionTitle(currentChatRoomId, newTitle);
                }, 100);
              }
              
              return { 
                ...session, 
                messages: updatedMessages,
                title: newTitle
              };
            }
            return session;
          });
          
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
                sessionId: `session_${room.id}`,
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
        timelineCache: state.timelineCache, // 캐시 데이터 저장 추가
        manhwaCache: state.manhwaCache // 캐시 데이터 저장 추가
        // selectedMode: state.selectedMode
      }) // 일부 상태만 저장
    }
  )
);

export default useComfortStore;
