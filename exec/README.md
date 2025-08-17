# 참견도치 - exec 폴더 산출물 안내

## 📁 폴더 구성

이 폴더는 SSAFY 프로젝트 산출물 제출을 위한 필수 문서들을 포함하고 있습니다.

```
exec/
├── README.md                           # 이 파일 (산출물 안내)
├── 1_빌드_및_배포_가이드.md               # 빌드/배포 문서
├── 2_외부_서비스_정보.md                 # 외부 서비스 정보
├── 3_DB_덤프_파일_생성_가이드.md          # DB 덤프 파일 안내
├── 4_시연_시나리오.md                   # 시연 시나리오
└── dochi_complete_dump.sql             # DB 덤프 파일
```

## 📋 산출물 목록

### 1. 빌드 및 배포 문서 📖
**파일명**: `1_빌드_및_배포_가이드.md`

**포함 내용**:
- ✅ JVM, 웹서버, WAS 제품 종류와 설정값, 버전 정보
- ✅ IDE 버전 및 개발 환경 정보
- ✅ 빌드 시 사용되는 환경변수 상세 기재
- ✅ 배포 시 특이사항 및 주의사항
- ✅ DB 접속 정보 및 주요 설정 파일 목록
- ✅ 단계별 빌드 및 배포 과정

**주요 기술 스택**:
- **Backend**: Java 17, Spring Boot 3.3.2, MySQL 8.0, Redis 7.0
- **Frontend**: Node.js 18.x, React 19, Vite 7.x, TailwindCSS 4.x
- **AI**: Python 3.9, FastAPI, TensorFlow
- **Infrastructure**: Docker, Docker Compose, Nginx

### 2. 외부 서비스 정보 📡
**파일명**: `2_외부_서비스_정보.md`

**포함 내용**:
- 🔐 **카카오 소셜 로그인**: OAuth 2.0 연동 정보
- ☁️ **AWS S3**: 파일 저장소 서비스 설정
- 🤖 **GMS AI 서비스**: AI 채팅 및 이미지 생성 API
- 📧 **Gmail SMTP**: 이메일 인증 서비스
- 📹 **LiveKit**: WebRTC 화상통화 서비스
- 🎤 **Google Cloud STT**: 음성 인식 서비스
- 🔑 **환경변수 통합 관리**: 모든 API 키 및 설정 정보

### 3. DB 덤프 파일 🗄️
**파일명**: `3_DB_덤프_파일_생성_가이드.md`, `dochi_complete_dump.sql`

**포함 내용**:
- 📊 **완전한 DB 스키마**: 전체 테이블 구조 및 관계
- 👥 **샘플 데이터**: 테스트용 사용자 및 갈등 데이터
- 🔧 **생성/복원 가이드**: 덤프 파일 활용 방법
- 📈 **백업 자동화**: 스크립트 및 관리 방안

**주요 테이블**:
- `users`: 사용자 정보 및 인증
- `user_conflicts`: 갈등 카드 데이터
- `chat_rooms`, `chat_messages`: 챗봇 대화 데이터
- `video_call_rooms`: 화상통화 세션
- `community_posts`, `comments`: 커뮤니티 기능
- `ai_analysis_results`: AI 분석 결과

### 4. 시연 시나리오 🎬
**파일명**: `4_시연_시나리오.md`

**포함 내용**:
- 🎯 **15-20분 완전 시연 시나리오**: 단계별 상세 가이드
- 🖱️ **클릭 위치 및 입력값**: 정확한 조작 방법
- 💬 **발표 멘트**: 각 기능별 설명 포인트
- ❓ **예상 질문 및 답변**: Q&A 대비
- ✅ **시연 체크리스트**: 사전 준비사항

**시연 순서**:
1. 서비스 소개 (2분)
2. 회원가입/로그인 (2분)
3. 갈등 카드 생성 (3분)
4. AI 토닥토닥 채팅 (5분)
5. 화상통화 및 감정분석 (4분)
6. 커뮤니티 기능 (2분)
7. 마이페이지 관리 (2분)

## 🚀 빠른 시작 가이드

### 1단계: 프로젝트 클론
```bash
git clone https://lab.ssafy.com/s13-webmobile1-sub1/S13P11C209.git
cd S13P11C209
```

### 2단계: 환경 설정
```bash
# 환경변수 파일 생성 (2_외부_서비스_정보.md 참조)
cp .env.example .env
# 필요한 API 키들을 .env 파일에 설정
```

### 3단계: DB 설정
```bash
# MySQL 데이터베이스 생성
mysql -u root -p -e "CREATE DATABASE dochi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 덤프 파일로 초기 데이터 로드
mysql -u root -p dochi < exec/dochi_complete_dump.sql
```

### 4단계: 서비스 실행
```bash
# Docker Compose로 전체 서비스 실행
docker-compose up -d

# 또는 개별 실행
cd SSAFY-DOCHI-BE && mvn spring-boot:run
cd SSAFY-DOCHI-FE && npm install && npm run dev
cd SSAFY-DOCHI-AI && pip install -r requirements.txt && uvicorn main:app --reload
```

### 5단계: 접속 확인
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **AI Server**: http://localhost:8000
- **API 문서**: http://localhost:8080/swagger-ui.html

## 🧪 테스트 계정

### 일반 사용자
```
이메일: testuser1@example.com
비밀번호: password123
닉네임: 철수킹
```

### 관리자 계정
```
이메일: admin@example.com
비밀번호: password123
닉네임: 어드민
```

## 📞 문의 및 지원

### 개발팀 연락처
- **팀명**: Team Harmony
- **프로젝트명**: 참견도치 (AI 기반 갈등 중재 플랫폼)
- **개발기간**: 2025년 7월 14일 ~ 8월 17일 (6주)

### 팀원 구성
| 이름 | 역할 | 담당 업무 |
|------|------|-----------|
| 박선우 | 팀장 | Full-Stack, AI 통합, 프로젝트 매니징 |
| 김태영 | 부팀장 | Frontend, UI/UX 디자인 |
| 이다혜 | Backend | 서버 개발, 데이터베이스 설계 |
| 김용빈 | AI | 머신러닝 모델, 데이터 분석 |
| 김소연 | DevOps | 인프라, CI/CD 파이프라인 |
| 신준호 | QA/기획 | 테스트, 기획, 문서화 |

### 기술 문의
각 문서의 상세 내용을 참조하시거나, 프로젝트 이슈가 있을 경우 개발팀에 문의해 주시기 바랍니다.

---

**⚠️ 중요사항**:
- 모든 API 키 및 비밀번호는 실제 운영 환경에서 변경해야 합니다
- 시연 전 반드시 사전 테스트를 수행하시기 바랍니다
- 외부 서비스 의존성으로 인해 네트워크 상태가 중요합니다

**📄 라이선스**: 이 프로젝트는 SSAFY 교육용으로 제작되었습니다.