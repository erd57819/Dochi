import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const comfortService = {
  // 채팅 세션 관련
  createSession: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/comfort/sessions`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  },

  getSessions: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/comfort/sessions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get sessions:', error);
      throw error;
    }
  },

  deleteSession: async (sessionId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/comfort/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  },

  // 메시지 관련
  sendMessage: async (sessionId, message, model = '참견도치') => {
    try {
      const response = await axios.post(`${API_BASE_URL}/comfort/messages`, {
        sessionId,
        message,
        model
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  getMessages: async (sessionId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/comfort/sessions/${sessionId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get messages:', error);
      throw error;
    }
  },

  // 타임라인 생성
  generateTimeline: async (sessionId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/comfort/timeline`, {
        sessionId
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to generate timeline:', error);
      throw error;
    }
  },

  // 네컷만화 생성
  generateManhwa: async (sessionId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/comfort/manhwa`, {
        sessionId
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to generate manhwa:', error);
      throw error;
    }
  },

  // 모델 변경
  changeModel: async (sessionId, model) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/comfort/sessions/${sessionId}/model`, {
        model
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to change model:', error);
      throw error;
    }
  }
};

export default comfortService;
