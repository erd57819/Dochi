const BASE_URL = '/dochi/video-call';

// 인증 헤더 생성
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const videoCallApi = {
  // 영상통화방 생성
  async createRoom(conflictId = null) {
    try {
      const response = await fetch(`${BASE_URL}/rooms`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ conflictId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('createRoom API 응답:', result); // 디버깅용
      return result.data || result;
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ roomCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result;
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
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result;
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
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('영상통화 종료 실패:', error);
      throw error;
    }
  },
};