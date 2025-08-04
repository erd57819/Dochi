import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useComfortStore = create(
  persist(
    (set, get) => ({
      // 채팅 세션 상태
      sessions: [],
      currentSessionId: null,
      messages: [],
      isLoading: false,
      error: null,

      // UI 상태
      isSidebarOpen: false,
      selectedModel: '참견도치',
      showTimeline: false,
      showManhwa: false,

      // 액션들
      createNewSession: () => {
        const newSession = {
          id: Date.now(),
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
          currentSessionId: newSession.id,
          messages: newSession.messages,
          showTimeline: false,
          showManhwa: false
        }));
      },

      loadSession: (sessionId) => {
        const { sessions } = get();
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          set({
            currentSessionId: sessionId,
            messages: session.messages,
            showTimeline: false,
            showManhwa: false
          });
        }
      },

      deleteSession: (sessionId) => {
        const { sessions, currentSessionId } = get();
        
        if (sessions.length === 1) {
          return false; // 최소 하나의 세션은 유지
        }
        
        const filteredSessions = sessions.filter(s => s.id !== sessionId);
        const newState = { sessions: filteredSessions };
        
        if (currentSessionId === sessionId) {
          const newCurrentSession = filteredSessions[filteredSessions.length - 1];
          newState.currentSessionId = newCurrentSession.id;
          newState.messages = newCurrentSession.messages;
        }
        
        set(newState);
        return true;
      },

      addMessage: (message) => {
        const { messages, sessions, currentSessionId } = get();
        const updatedMessages = [...messages, message];
        
        const updatedSessions = sessions.map(session => 
          session.id === currentSessionId 
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

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setShowTimeline: (show) => set({ showTimeline: show }),
      setShowManhwa: (show) => set({ showManhwa: show }),

      // 전체 상태 초기화
      reset: () => set({
        sessions: [],
        currentSessionId: null,
        messages: [],
        isLoading: false,
        error: null,
        isSidebarOpen: false,
        selectedModel: '참견도치',
        showTimeline: false,
        showManhwa: false
      })
    }),
    {
      name: 'comfort-storage', // localStorage에 저장될 key
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
        selectedModel: state.selectedModel
      }) // 일부 상태만 저장
    }
  )
);

export default useComfortStore;
