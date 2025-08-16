// 갈등 레포트 API 서비스
const API_BASE_URL = window.location.hostname === 'localhost'
  ? '/ai'  // 로컬 개발 (vite proxy 사용)
  : 'https://i13c209.p.ssafy.io/ai';  // 배포 환경 (직접 연결)

export const conflictReportApi = {
  // 전체 레포트 가져오기
  async getFullReport(roomId) {
    const response = await fetch(`${API_BASE_URL}/conflict-report/${roomId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // 대화 히스토리와 함께 레포트 생성 요청
  async getFullReportWithData(roomId, conversationData = null, emotionData = null) {
    const requestBody = {
      roomId,
      conversationData,
      emotionData
    };

    console.log('[레포트 API] 데이터와 함께 요청:', requestBody);

    const response = await fetch(`${API_BASE_URL}/conflict-report/${roomId}/with-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
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