# 카카오 로그인 구현 가이드

## 구현 완료 내용

### 1. 생성된 파일들

#### 컴포넌트
- **`/src/components/auth/KakaoLoginButton.jsx`**
  - 카카오 로그인 버튼 컴포넌트
  - 카카오 공식 디자인 가이드에 맞는 스타일링
  - 카카오 OAuth 인증 페이지로 리다이렉트 처리

- **`/src/components/auth/KakaoWithdrawButton.jsx`**
  - 카카오 계정 탈퇴 버튼 컴포넌트
  - 소셜 로그인 사용자를 위한 탈퇴 처리

#### 페이지
- **`/src/pages/KakaoCallbackPage.jsx`**
  - 카카오 로그인 콜백 처리 페이지
  - OAuth 인증 코드를 백엔드로 전송
  - 로그인 성공/실패 처리 및 에러 핸들링
  - 로딩 및 에러 상태 UI 포함

- **`/src/pages/KakaoWithdrawCallbackPage.jsx`**
  - 카카오 회원탈퇴 콜백 처리 페이지
  - 탈퇴 처리 및 로컬 스토리지 정리

#### 서비스 및 설정
- **`/src/services/kakaoAuthService.js`**
  - 카카오 로그인/탈퇴 API 호출 서비스
  - 백엔드 API와의 통신 로직

- **`/src/config/kakaoConfig.js`**
  - 카카오 OAuth 설정 관리
  - REST API 키 및 리다이렉트 URI 관리

- **`/src/config/axios.js`**
  - Axios 인터셉터 설정
  - 자동 토큰 관리 및 리프레시 처리

### 2. 수정된 파일들

- **`/src/App.jsx`**
  - 카카오 콜백 라우트 추가 (`/kakao/callback`, `/kakao/withdraw`)

- **`/src/pages/LoginPage.jsx`**
  - 기존 카카오 버튼을 KakaoLoginButton 컴포넌트로 교체

## 구현된 기능

### 1. 카카오 로그인 플로우
1. 사용자가 로그인 페이지에서 카카오 로그인 버튼 클릭
2. 카카오 OAuth 인증 페이지로 리다이렉트
3. 사용자가 카카오 계정으로 로그인 및 권한 동의
4. `/kakao/callback`으로 인증 코드와 함께 리다이렉트
5. 백엔드 API(`/dochi/oauth`)로 인증 코드 전송
6. 백엔드에서 카카오 API를 통해 사용자 정보 조회 및 JWT 토큰 발급
7. 프론트엔드에서 토큰 저장 및 사용자 정보 스토어 업데이트
8. 메인 페이지로 이동

### 2. 에러 처리
- 카카오 로그인 취소 시 처리
- 네트워크 오류 처리
- 인증 코드 누락 시 처리
- 백엔드 API 오류 처리

### 3. 토큰 관리
- Access Token과 Refresh Token을 localStorage에 저장
- Axios 인터셉터를 통한 자동 토큰 첨부
- 401 에러 시 자동 토큰 리프레시

### 4. UI/UX 개선
- 로딩 상태 표시 (스피너 애니메이션)
- 에러 메시지 표시
- 카카오 공식 아이콘 사용
- 자동 페이지 이동 (타임아웃 설정)

## 사용 방법

### 1. 로그인
```jsx
// LoginPage에서 자동으로 렌더링됨
<KakaoLoginButton />
```

### 2. 회원탈퇴 (소셜 로그인 사용자)
```jsx
// MyPage에서 사용 가능
import KakaoWithdrawButton from '../components/auth/KakaoWithdrawButton';

// 사용자가 소셜 로그인인 경우에만 표시
{user?.isSocial && <KakaoWithdrawButton />}
```

### 3. API 호출 시 토큰 자동 포함
```jsx
import apiClient from '../config/axios';

// 토큰이 자동으로 헤더에 포함됨
const response = await apiClient.get('/user/profile');
```

## 주의사항

1. **환경 변수**: 현재 카카오 REST API 키가 하드코딩되어 있음. 프로덕션에서는 환경 변수로 관리 권장
2. **CORS**: 개발 환경에서는 Vite 프록시 설정 필요
3. **리다이렉트 URI**: 카카오 앱 설정에서 리다이렉트 URI 등록 필요
   - 개발: `http://localhost:5173/kakao/callback`
   - 프로덕션: `https://yourdomain.com/kakao/callback`

## 추후 개선사항

1. 환경 변수를 통한 API 키 관리
2. 구글 로그인 등 다른 소셜 로그인 추가
3. 로그인 상태 유지 개선 (Remember Me 기능)
4. 더 나은 에러 메시지 및 사용자 피드백
