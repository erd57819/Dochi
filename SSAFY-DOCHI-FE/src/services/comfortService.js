import apiClient from '../config/axios.js';

const comfortService = {
  // 채팅방 생성
  createChatRoom: async (title = '새로운 대화') => {
    try {
      const response = await apiClient.post('/chat/rooms', { title });
      return response.data;
    } catch (error) {
      console.error('Failed to create chat room:', error);
      throw error;
    }
  },

  // 채팅방 목록 조회  
  getChatRooms: async () => {
    try {
      const response = await apiClient.get('/chat/rooms');
      return response.data;
    } catch (error) {
      console.error('Failed to get chat rooms:', error);
      throw error;
    }
  },

  // 채팅방 삭제
  deleteChatRoom: async (chatRoomId) => {
    try {
      const response = await apiClient.delete(`/chat/rooms/${chatRoomId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete chat room:', error);
      throw error;
    }
  },

  // 채팅방 제목 수정
  updateChatRoomTitle: async (chatRoomId, title) => {
    try {
      const response = await apiClient.put(`/chat/rooms/${chatRoomId}/title`, { newTitle: title });
      return response.data;
    } catch (error) {
      console.error('Failed to update chat room title:', error);
      throw error;
    }
  },

  // 메시지 전송 (핵심 기능)
  sendMessage: async (sessionId, message, mode = 'NORMAL') => {
    const requestStartTime = Date.now();
    const requestId = `req_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🚀 [${requestId}] API 요청 시작:`, {
      sessionId,
      mode,
      messageLength: message?.length || 0,
      timestamp: new Date().toISOString(),
      url: '/chat'
    });
    
    try {
      const requestConfig = {
        sessionId,
        message, 
        mode
      };
      
      const axiosConfig = mode === 'COMIC' ? { timeout: 180000 } : {};
      
      if (mode === 'COMIC') {
        console.log(`⏱️ [${requestId}] COMIC 모드: 타임아웃 180초 설정`);
      }
      
      console.log(`📤 [${requestId}] 요청 전송 중...`);
      const response = await apiClient.post('/chat', requestConfig, axiosConfig);
      
      const requestDuration = Date.now() - requestStartTime;
      console.log(`✅ [${requestId}] API 응답 성공:`, {
        status: response.status,
        duration: `${requestDuration}ms`,
        responseSize: JSON.stringify(response.data).length,
        timestamp: new Date().toISOString()
      });
      
      if (mode === 'COMIC' && response.data?.message?.startsWith('COMIC_GENERATING:')) {
        const comicId = response.data.message.replace('COMIC_GENERATING:', '');
        console.log(`🎨 [${requestId}] 만화 생성 시작됨: comicId=${comicId}`);
      }
      
      return response.data;
    } catch (error) {
      const requestDuration = Date.now() - requestStartTime;
      console.error(`❌ [${requestId}] API 요청 실패:`, {
        error: error.message,
        duration: `${requestDuration}ms`,
        status: error.response?.status,
        statusText: error.response?.statusText,
        timestamp: new Date().toISOString()
      });
      
      if (error.code === 'ECONNABORTED') {
        console.error(`⏰ [${requestId}] 타임아웃 발생! ${requestDuration}ms 후 중단됨`);
      } else if (error.response?.status >= 500) {
        console.error(`🔥 [${requestId}] 서버 오류 발생: ${error.response.status}`);
      } else if (!error.response) {
        console.error(`🌐 [${requestId}] 네트워크 오류: 서버 연결 실패`);
      }
      
      throw error;
    }
  },

  // 채팅 기록 조회
  getMessages: async (chatRoomId, sessionId) => {
    try {
      const response = await apiClient.get(`/chat/rooms/${chatRoomId}/messages`, {
        params: { sessionId }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get messages:', error);
      throw error;
    }
  },

  // 세션 저장 (Redis → DB 저장)
  saveSession: async (sessionId, chatRoomId) => {
    try {
      const response = await apiClient.post('/chat/save', null, {
        params: { sessionId, chatRoomId }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  },

  // 세션 종료 (Redis → DB 저장)
  exitSession: async (sessionId, chatRoomId) => {
    try {
      const response = await apiClient.post('/chat/exit', null, {
        params: { sessionId, chatRoomId }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to exit session:', error);
      throw error;
    }
  },

  // 만화 생성 상태 확인
  checkComicStatus: async (comicId) => {
    try {
      console.log(`🔍 만화 상태 확인: comicId=${comicId}`);
      const response = await apiClient.get(`/chat/comic/status/${comicId}`);
      console.log(`✅ 만화 상태 응답:`, response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to check comic status:', error);
      throw error;
    }
  },

};

export default comfortService;
