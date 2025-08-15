import apiClient from '../config/axios.js';

export const videoCallApi = {
  // 영상통화방 생성
  async createRoom(conflictId = null) {
    try {
      const response = await apiClient.post('/video-call/rooms', { conflictId });
      console.log('createRoom API 응답:', response.data); // 디버깅용
      return response.data.data || response.data;
    } catch (error) {
      console.error('영상통화방 생성 실패:', error);
      throw error;
    }
  },

  // 영상통화방 참여
  async joinRoom(roomCode) {
    try {
      const response = await apiClient.post('/video-call/rooms/join', { roomCode });
      return response.data.data || response.data;
    } catch (error) {
      console.error('영상통화방 참여 실패:', error);
      throw error;
    }
  },

  // 영상통화방 정보 조회
  async getRoomInfo(roomCode) {
    try {
      const response = await apiClient.get(`/video-call/rooms/${roomCode}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('영상통화방 정보 조회 실패:', error);
      throw error;
    }
  },

  // 영상통화 종료
  async endCall(roomCode) {
    try {
      const response = await apiClient.put(`/video-call/rooms/${roomCode}/end`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('영상통화 종료 실패:', error);
      throw error;
    }
  },
};