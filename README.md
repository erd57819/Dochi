# 🦔 참견도치

> **실시간 감정·대화 분석을 통한 AI 갈등 해결 서비스**  
> 참견도치는 **AI 기반 감정 분석**과 **실시간 대화 코칭(WebRTC)**을 통해 갈등 상황을 분석하고, 맞춤형 해결 솔루션을 제공하는 **통합 갈등 중재 플랫폼**입니다.  
> WebRTC 실시간 대화 코칭, AI 챗봇, 커뮤니티, 게임 요소(룰렛, 사다리타기 등)까지 결합하여 사용자 친화적인 갈등 해결 환경을 제공합니다.

🔗 **배포 URL** : [https://i13c209.p.ssafy.io/](https://i13c209.p.ssafy.io/)

---

## 프로젝트 개요
- **프로젝트명** : 참견도치
- **참여 인원** : 6명 (박선우, 김소연, 김태영, 신준호, 김용빈, 이다혜)
- **진행 기간** : 2025.07.07 ~ 2025.08.18 (6주)

---

## 기술 스택

### Frontend
- React 18, JavaScript, HTML5, CSS3, Tailwind CSS
- Zustand (상태 관리), Chart.js (시각화)
- WebRTC (LiveKit, OpenVidu)

### Backend
- Spring Boot 3.x, Java 17
- Spring Security, JWT Authentication
- JPA/MyBatis, MySQL, Redis
- WebSocket, SSE

### AI/ML
- FastAPI (Python)
- OpenAI GPT (GPT-4.1), Claude 3.5 / 3.7
- Google Cloud Natural Language (대화 감정 분석)
- Google Cloud Speech-to-Text (STT)
- Face-API.js (실시간 표정 인식)
- DALL·E3 (네컷만화 생성)

### Infra & DevOps
- AWS EC2, S3
- Docker, Nginx
- GitLab CI/CD, Jenkins
- Apache Kafka (Message Queue)

---

## 주요 기능

### 1. AI 갈등 레포트 생성
- 고민/갈등을 **유형·상황·목표** 별로 요약·분석
- 맞춤형 서비스 추천 (로드맵, 챗봇, 커뮤니티 등)
- 갈등 관리 유형(회피형, 호의형, 타협형, 경쟁형, 협력형) 자동 분류
- 책임 비율 분석 제공

### 2. 실시간 대화 코칭 (화상채팅 기반)
- WebRTC 영상통화 중 **표정+음성 실시간 분석**
- 갈등 상황을 AI가 실시간 코칭 (중재, 해결 방안 제안)
- 논문 기반 프롬프트 적용 → 객관적이고 구체적인 대화법 제공

### 3. 토닥토닥 챗봇
- GPT 한계를 보완한 **고민 상담 특화 프롬프트 모델**
- 위로·조언 제공, 갈등 타임라인 정리
- **거울치료용 네컷만화** 및 감정 변화 시각화 제공

### 4. AI 자동생성 커뮤니티
- AI가 갈등 레포트 내용을 바탕으로 게시글 자동 작성
- “조언해주세요”, “찬반투표” 등 상황별 맞춤 게시판 글 생성

### 5. 게이미피케이션 요소
- 간단한 갈등 게임(룰렛, 사다리타기, 고슴도치 잡기)
- 유저 유입 확대 및 서비스 재미 요소 제공

---

## 프로젝트 구조
```
SSAFY-DOCHI/
├── SSAFY-DOCHI-FE/ # React Frontend
│ ├── components/ # 재사용 컴포넌트
│ ├── pages/ # 페이지 단위
│ ├── hooks/ # 커스텀 훅
│ ├── stores/ # Zustand 상태 관리
│ └── services/ # API 서비스
├── SSAFY-DOCHI-BE/ # Spring Boot Backend
│ ├── domain/ # 엔티티
│ ├── controller/ # REST 컨트롤러
│ ├── service/ # 비즈니스 로직
│ ├── repository/ # 데이터 액세스
│ └── security/ # 인증/인가
└── SSAFY-DOCHI-AI/ # FastAPI AI Server
├── routers/ # AI 라우터
├── services/ # AI 서비스
├── models/ # 분석 모델
└── core/ # 설정
```

---

## 아키텍처 특성
- **Dual Backend 구조**
  - Spring Boot : 인증/인가, 비즈니스 로직, 데이터 관리
  - FastAPI : AI 모델 처리, 감정 분석, 자연어 처리 전담

- **실시간 확장성**
  - WebRTC 기반 멀티룸 (LiveKit/OpenVidu)
  - Kafka 파티셔닝으로 roomId 단위 메시지 분산 처리

- **한국어 특화 감정 분석**
  - 간접 표현/문화적 맥락 반영한 한국어 감정 분류 모델

- **DevOps 환경**
  - Docker + Jenkins CI/CD 
  - Jenikins 파이프라인 병렬화 

---

## 팀원 소개
| 이름   | 역할            | 담당 업무 |
|------|-----------------|--------------------------------|
| 박선우 | Frontend        | 프론트엔드 개발, 사용자 경험 개선 |
| 김소연 | Backend/AI      | 백엔드 API 개발, AI 서비스 연동, 실시간 데이터 처리 |
| 김태영 | Backend/AI      | 백엔드 개발, 데이터베이스 관리, AI 모델 연동 |
| 신준호 | Backend/Infra   | 백엔드 개발, 인프라 환경 구축 |
| 김용빈 | Frontend/Infra  | 프론트엔드 개발, 클라우드 인프라 및 배포 환경 관리 |
| 이다혜 | Frontend/Design | 프론트엔드 개발, UI/UX 디자인 및 반응형 최적화 |

---
### 🔧 주요 기술적 이슈와 해결책

  | 도전 과제 | 해결 방안 |
  |----------|----------|
  | **실시간 멀티모달 분석 성능** | Face-API.js + Google Cloud Speech API 병렬 처리 |
  | **대용량 동시 접속 처리** | Kafka 파티셔닝으로 roomId 기반 메시지 분산 |
  | **AI 응답 품질 일관성** | 논문 기반 구조화된 프롬프트 템플릿 적용 |
  | **실시간 WebRTC 안정성** | LiveKit/OpenVidu 이중화 구성 |
  | **한국어 감정 분석 정확도** | Google Cloud NLP + 커스텀 감정 분류 모델 조합 |

---

## 성과 및 기대효과
- **기술적 성과**
  - 실시간 멀티모달 감정 분석 (표정+음성)
  - Dual Backend 아키텍처로 역할 분리 및 확장성 확보
  - 무중단 CI/CD 파이프라인 구축

- **사회적 효과**
  - 온라인 기반 접근성 향상 (비용·거리 제약 해소)
  - 객관적 데이터(논문, 이론) 기반 중재로 감정 치우침 방지
  - 갈등 예방 및 건강한 소통 문화 확산


---

✦ **참견도치**는 AI 기반 갈등 해결의 새로운 패러다임을 제시하는 플랫폼으로, 건강한 관계 형성과 소통 문화 확산에 기여합니다.
