// 갈등 레포트 API 서비스
const API_BASE_URL = '/ai';

export const conflictReportApi = {
  // 전체 레포트 가져오기
  async getFullReport(roomId) {
    const response = await fetch(`${API_BASE_URL}/conflict-report/${roomId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // 요약 정보만 가져오기
  async getSummary(roomId) {
    const response = await fetch(`${API_BASE_URL}/conflict-report/${roomId}/summary`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // 특정 화자의 감정 그래프 데이터
  async getEmotionGraph(roomId, speaker) {
    const response = await fetch(`${API_BASE_URL}/conflict-report/${roomId}/emotion-graph/${speaker}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // 특정 화자의 액션 플랜
  async getActionPlan(roomId, speaker) {
    const response = await fetch(`${API_BASE_URL}/conflict-report/${roomId}/action-plan/${speaker}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // 캐시 삭제
  async clearCache(roomId) {
    const response = await fetch(`${API_BASE_URL}/conflict-report/${roomId}/cache`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
};