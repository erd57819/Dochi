# 참견도치 - AI 기반 갈등 중재 플랫폼

<!-- 필수 항목 -->

## 카테고리

| Application | Domain | Language | Framework |
| ---- | ---- | ---- | ---- |
| :white_check_mark: Desktop Web | :white_check_mark: AI | :white_check_mark: JavaScript | :white_check_mark: Vue.js |
| :white_check_mark: Mobile Web | :black_square_button: Big Data | :black_square_button: TypeScript | :white_check_mark: React |
| :white_check_mark: Responsive Web | :black_square_button: Blockchain | :black_square_button: C/C++ | :black_square_button: Angular |
| :black_square_button: Android App | :black_square_button: IoT | :black_square_button: C# | :black_square_button: Node.js |
| :black_square_button: iOS App | :black_square_button: AR/VR/Metaverse | :white_check_mark: Python | :black_square_button: Flask/Django |
| :black_square_button: Desktop App | :black_square_button: Game | :white_check_mark: Java | :white_check_mark: Spring/Springboot |
| | | :black_square_button: Kotlin | :white_check_mark: FastAPI |

<!-- 필수 항목 -->

## 프로젝트 소개

* **프로젝트명**: 참견도치 (AI 기반 갈등 중재 플랫폼)
* **서비스 특징**: 일상에서 발생하는 갈등을 AI가 분석하고 해결책을 제시하는 종합 중재 서비스
* **주요 기능**
  - 🤖 **AI 갈등 패턴 분석**: 개인 맞춤형 갈등 패턴 분석 및 예방 전략 제공
  - 📹 **실시간 화상 대화**: 감정 분석과 함께하는 AI 중재 화상 채팅
  - 🗺️ **단계별 해결 로드맵**: 갈등 유형별 맞춤형 해결 과정 안내
  - 🗳️ **익명 투표 시스템**: 제3자 관점의 객관적 의견 수집
  - 👩‍⚕️ **전문 상담사 매칭**: AI 기반 최적 상담사 매칭 시스템
  - 🚨 **갈등 예방 알림**: 실시간 갈등 위험도 측정 및 예방 가이드
  - 🧘‍♀️ **맞춤 힐링 센터**: 갈등 후 마음 치유 프로그램
  - 🎮 **게이미피케이션**: 레벨 시스템, 경험치, 업적 시스템

* **주요 기술**
  - **AI/ML**: 감정 분석, 패턴 인식, 자연어 처리
  - **WebRTC**: 실시간 화상 통화 및 음성 분석
  - **WebSocket**: 실시간 채팅 및 알림
  - **JWT Authentication**: 보안 인증 시스템
  - **REST API**: 마이크로서비스 아키텍처
  - **Redis**: 실시간 데이터 캐싱
  - **Docker**: 컨테이너화된 배포

* **참조 리소스**
  * **Pretendard Font**: 한글 최적화 폰트로 전체 UI 디자인에 적용
  * **Emotion.js**: 감정 분석 시각화 라이브러리
  * **Chart.js**: 갈등 패턴 및 통계 차트 시각화
  * **Three.js**: 3D 감정 표현 및 인터랙티브 요소
  * **Lottie**: 마이크로 애니메이션 및 상태 표현
  * **OpenCV**: 화상 통화 중 표정 분석
  * **TensorFlow.js**: 클라이언트 사이드 감정 분석 모델
  * **Socket.io**: 실시간 양방향 통신
  * **Tailwind CSS**: 유틸리티 퍼스트 CSS 프레임워크

* **배포 환경**
  - **Production URL**: https://chamgyeondochi.com
  - **Staging URL**: https://dev.chamgyeondochi.com  
  - **API Documentation**: https://api.chamgyeondochi.com/docs
  - **테스트 계정**: 
    - 일반 사용자: `test@chamgyeon.com` / `test1234`
    - 상담사: `counselor@chamgyeon.com` / `counsel1234`

<!-- 자유 양식 -->

## 팀 소개

### 🎯 Team Harmony

* **박선우** (팀장): Full-Stack 개발, AI 모델 통합, 프로젝트 매니징
  - AI 감정 분석 시스템 개발
  - WebRTC 화상 통화 시스템 구축
  - 전체 아키텍처 설계

* **김태영** (부팀장): Frontend 개발, UI/UX 디자인
  - React 기반 반응형 웹 개발
  - 사용자 경험 최적화
  - 디자인 시스템 구축

* **이다혜** (Backend 개발): 서버 개발, 데이터베이스 설계
  - Spring Boot REST API 개발
  - MySQL/Redis 데이터베이스 설계
  - JWT 인증 시스템 구현

* **김용빈** (AI 개발): 머신러닝 모델 개발, 데이터 분석
  - 감정 분석 모델 훈련
  - 갈등 패턴 분석 알고리즘
  - FastAPI 서버 개발

* **김소연** (DevOps): 인프라 구축, CI/CD 파이프라인
  - Docker 컨테이너화
  - Jenkins CI/CD 구축
  - AWS 클라우드 인프라 관리

* **신준호** (QA/기획): 테스트, 기획, 문서화
  - 서비스 기획 및 사용자 시나리오 작성
  - 품질 보증 및 테스트 자동화
  - 기술 문서 작성

<!-- 자유 양식 -->

## 프로젝트 상세 설명

### 🏗️ **시스템 아키텍처**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Server     │
│   (React/Vue)   │◄──►│ (Spring Boot)   │◄──►│   (FastAPI)     │
│                 │    │                 │    │                 │
│ - React 18      │    │ - Java 17       │    │ - Python 3.9    │
│ - WebRTC        │    │ - MySQL 8.0     │    │ - TensorFlow    │
│ - Socket.io     │    │ - Redis 7.0     │    │ - OpenCV        │
│ - Tailwind CSS  │    │ - MyBatis       │    │ - scikit-learn  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Infrastructure │
                    │                 │
                    │ - Docker        │
                    │ - Jenkins       │
                    │ - AWS EC2       │
                    │ - AWS RDS       │
                    │ - AWS S3        │
                    └─────────────────┘
```

### 🛠️ **기술 스택**

#### **Frontend**
- **React 18**: 컴포넌트 기반 UI 라이브러리
- **Vue.js 3**: 관리자 페이지 (Composition API)
- **TypeScript**: 타입 안전성 보장
- **Tailwind CSS**: 유틸리티 퍼스트 CSS 프레임워크
- **WebRTC**: 실시간 화상/음성 통신
- **Socket.io**: 실시간 양방향 통신
- **Three.js**: 3D 시각화 및 인터랙션
- **Chart.js**: 데이터 시각화
- **PWA**: 모바일 앱 수준의 사용자 경험

#### **Backend**
- **Java 17**: OpenJDK LTS
- **Spring Boot 3.1**: 엔터프라이즈 웹 프레임워크
- **Spring Security**: 인증/인가 시스템
- **MySQL 8.0**: 관계형 데이터베이스
- **MyBatis**: SQL 매퍼 프레임워크
- **Redis**: 세션 관리 및 캐싱
- **JWT**: 무상태 인증 토큰
- **Swagger**: API 문서화

#### **AI/ML**
- **Python 3.9**: 머신러닝 개발 언어
- **FastAPI**: 고성능 Python 웹 프레임워크
- **TensorFlow 2.x**: 딥러닝 프레임워크
- **OpenCV**: 컴퓨터 비전 라이브러리
- **scikit-learn**: 머신러닝 라이브러리
- **NLTK**: 자연어 처리
- **Transformers**: 사전 훈련된 언어 모델

#### **DevOps & Infrastructure**
- **Docker**: 컨테이너화
- **Jenkins**: CI/CD 파이프라인
- **AWS EC2**: 클라우드 컴퓨팅
- **AWS RDS**: 관리형 데이터베이스
- **AWS S3**: 객체 스토리지
- **Nginx**: 리버스 프록시 및 로드 밸런서
- **Let's Encrypt**: SSL/TLS 인증서

### 🗄️ **데이터베이스 ERD**

```sql
Users
├── user_id (PK)
├── email
├── nickname
├── password_hash
├── profile_image
├── level
├── experience_points
├── created_at
└── updated_at

Conflicts
├── conflict_id (PK)
├── user_id (FK)
├── title
├── description
├── conflict_type
├── severity_level
├── status
├── created_at
└── resolved_at

ConflictAnalysis
├── analysis_id (PK)
├── conflict_id (FK)
├── emotion_scores
├── pattern_type
├── risk_level
├── ai_recommendations
└── analyzed_at

VideoSessions
├── session_id (PK)
├── conflict_id (FK)
├── participants
├── duration
├── emotion_timeline
├── intervention_points
└── session_date

Counselors
├── counselor_id (PK)
├── name
├── specializations
├── rating
├── availability
└── license_info
```

### 🎯 **핵심 기능 상세**

#### 1. **AI 갈등 분석 시스템**
- **감정 인식**: 텍스트/음성/표정 분석을 통한 실시간 감정 상태 파악
- **패턴 분석**: 개인별 갈등 히스토리 분석으로 반복 패턴 발견
- **위험도 예측**: 갈등 에스컬레이션 가능성 사전 예측
- **맞춤 솔루션**: 개인 성향과 상황에 맞는 해결책 제시

#### 2. **실시간 화상 중재 시스템**
- **WebRTC 기반**: 고품질 화상/음성 통화
- **실시간 감정 분석**: 대화 중 감정 변화 모니터링
- **AI 중재 개입**: 갈등 심화 시 자동 중재 메시지 제공
- **대화 기록**: STT(Speech-to-Text)를 통한 대화 내용 분석

#### 3. **게이미피케이션 시스템**
- **레벨 시스템**: 갈등 해결 경험에 따른 레벨 업
- **업적 시스템**: 다양한 달성 목표와 보상
- **포인트 시스템**: 활동별 포인트 적립 및 활용
- **리더보드**: 커뮤니티 내 랭킹 시스템

### 📱 **반응형 디자인**

- **Mobile First**: 모바일 우선 설계
- **Progressive Web App**: 네이티브 앱 수준의 사용자 경험
- **다크/라이트 모드**: 사용자 선호도에 따른 테마 전환
- **접근성**: WCAG 2.1 AA 수준 웹 접근성 준수

### 🔒 **보안 및 프라이버시**

- **종단간 암호화**: 모든 통신 데이터 암호화
- **개인정보 보호**: GDPR/개인정보보호법 준수
- **익명화 처리**: 민감 정보 자동 마스킹
- **데이터 최소화**: 필요 최소한의 데이터만 수집

### 🚀 **배포 및 모니터링**

- **Blue-Green 배포**: 무중단 서비스 배포
- **자동 스케일링**: 트래픽에 따른 자동 확장/축소
- **실시간 모니터링**: Prometheus + Grafana
- **로그 관리**: ELK Stack을 통한 중앙화된 로그 관리

### 📊 **성능 지표**

- **응답 시간**: 평균 200ms 이하
- **가용성**: 99.9% 이상
- **동시 접속자**: 최대 10,000명 지원
- **AI 분석 정확도**: 92% 이상

---

## 🚀 **시작하기**

### 요구사항
- Node.js 18+
- Java 17+
- Python 3.9+
- Docker 20.10+
- MySQL 8.0+
- Redis 7.0+

### 설치 및 실행
```bash
# 저장소 클론
git clone https://gitlab.com/team-harmony/chamgyeondochi.git
cd chamgyeondochi

# Docker를 통한 전체 시스템 실행
docker-compose up -d

# 또는 개별 실행
cd frontend && npm install && npm start
cd backend && mvn spring-boot:run
cd ai-server && pip install -r requirements.txt && uvicorn main:app
```

### 🔗 **관련 링크**

- [📖 기술 문서](https://docs.chamgyeondochi.com)
- [🎨 디자인 시스템](https://design.chamgyeondochi.com)
- [📊 시스템 모니터링](https://monitor.chamgyeondochi.com)
- [🐛 이슈 트래커](https://gitlab.com/team-harmony/chamgyeondochi/-/issues)