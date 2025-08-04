// Kakao OAuth 관련 설정
export const KAKAO_CONFIG = {
  REST_API_KEY: 'f4e28a831bec6c6ee84aecc5e831743f',
  REDIRECT_URI: `${window.location.origin}/kakao/callback`,
  WITHDRAW_REDIRECT_URI: `${window.location.origin}/kakao/withdraw`,
};

// Kakao Auth URL 생성 함수
export const getKakaoAuthUrl = () => {
  const { REST_API_KEY, REDIRECT_URI } = KAKAO_CONFIG;
  return `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;
};

// Kakao 회원탈퇴 URL 생성 함수
export const getKakaoWithdrawUrl = () => {
  const { REST_API_KEY, WITHDRAW_REDIRECT_URI } = KAKAO_CONFIG;
  return `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${WITHDRAW_REDIRECT_URI}&response_type=code`;
};
