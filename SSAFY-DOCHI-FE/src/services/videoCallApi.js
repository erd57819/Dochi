const BASE_URL = '/api/video-call';

export const videoCallApi = {
  // 영상통화방 생성
  async createRoom(conflictId = null) {
    try {
      const response = await fetch(`${BASE_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conflictId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('영상통화방 생성 실패:', error);
      throw error;
    }
  },

  // 영상통화방 참여
  async joinRoom(roomCode) {
    try {
      const response = await fetch(`${BASE_URL}/rooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('영상통화방 참여 실패:', error);
      throw error;
    }
  },

  // 영상통화방 정보 조회
  async getRoomInfo(roomCode) {
    try {
      const response = await fetch(`${BASE_URL}/rooms/${roomCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('영상통화방 정보 조회 실패:', error);
      throw error;
    }
  },

  // 영상통화 종료
  async endCall(roomCode) {
    try {
      const response = await fetch(`${BASE_URL}/rooms/${roomCode}/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.ok;
    } catch (error) {
      console.error('영상통화 종료 실패:', error);
      throw error;
    }
  },
};