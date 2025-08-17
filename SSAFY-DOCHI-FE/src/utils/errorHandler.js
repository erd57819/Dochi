// 서버 메시지 기반 오류 처리 유틸리티

export const handleApiError = (error) => {
  const statusCode = error.response?.status;
  const serverMessage = error.response?.data?.message;
  
  console.log('🔍 API 오류 디버깅:', {
    status: statusCode,
    serverMessage: serverMessage,
    url: error.config?.url,
    method: error.config?.method
  });
  
  // 500 에러: 서버 메시지가 사용자 친화적이면 그대로 사용
  if (statusCode === 500) {
    console.error('서버 오류:', serverMessage);
    
    // 사용자 친화적인 메시지인지 확인
    if (isUserFriendlyMessage(serverMessage)) {
      return serverMessage; // 서버 메시지 그대로 사용
    }
    
    // 기술적인 메시지면 일반적인 안내
    return '다시 로그인해주세요.';
  }
  
  // 401 에러: 토큰 갱신 로직에서 처리하므로 여기서는 제외
  if (statusCode === 401) {
    return null;
  }
  
  // 나머지 오류: 서버 메시지 그대로 사용
  if (serverMessage && typeof serverMessage === 'string') {
    return serverMessage;
  }
  
  // 네트워크 오류 등
  if (error.request) {
    return '인터넷 연결을 확인해주세요.';
  }
  
  return '요청 처리에 실패했습니다.';
};

// 사용자 친화적 메시지 판단 함수
const isUserFriendlyMessage = (message) => {
  if (!message || typeof message !== 'string') return false;
  
  // 사용자가 이해할 수 있는 키워드들
  const userFriendlyKeywords = [
    '비밀번호', '이메일', '아이디', '회원가입', '로그인',
    '권한', '존재하지 않는', '이미 사용중인', '인증',
    '게시글', '댓글', '찾을 수 없습니다', '중복'
  ];
  
  // 기술적인 키워드들 (이것들이 포함되면 기술적 메시지로 판단)
  const technicalKeywords = [
    'java.lang', 'exception', 'error', 'null', 'undefined',
    'stack', 'trace', 'org.springframework', 'hibernate',
    'sql', 'database', 'constraint', 'foreign key'
  ];
  
  const lowerMessage = message.toLowerCase();
  
  // 기술적 키워드가 포함되어 있으면 사용자 친화적이지 않음
  if (technicalKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return false;
  }
  
  // 사용자 친화적 키워드가 포함되어 있으면 사용자 친화적
  return userFriendlyKeywords.some(keyword => lowerMessage.includes(keyword));
};

export const showError = (message) => {
  if (message) {
    console.log('🚨 사용자에게 표시되는 오류:', message);
    alert(`${message}`);
  }
};

export const showSuccess = (message) => {
  console.log('✅ 성공 메시지:', message);
  alert(`${message}`);
};
