import axios from 'axios';

// 환경에 따라 다른 방식 사용
const getApiConfig = () => {
  if (window.location.hostname === 'localhost') {
    // 로컬: vite 프록시 사용 (/dochi)
    return {
      baseURL: '/dochi',
    };
  } else {
    // 배포: nginx 프록시 사용 (/dochi)  
    return {
      baseURL: '/dochi',
    };
  }
};

// axios 인터셉터로 토큰 자동 추가
const apiClient = axios.create({
  ...getApiConfig(),
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
    try {
      const response = await apiClient.post('/chat', {
        sessionId,
        message, 
        mode // NORMAL, COMFORT_ONLY, TIMELINE, COMIC
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
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
  }
};

export default comfortService;
