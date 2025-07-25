# 웹 기술 Backend
test 5
<!-- 필수 항목 -->

## 소개

웹 기술 프로젝트의 Backend 스켈레톤 코드

<!-- 필수 항목 -->

## 기술스택 및 라이브러리

| Project | Version | Description      |
| ------- |---------|------------------|
| Java    | 17.0.15 | Open JDK LTS     |
| Maven   | 3.9+    | Build Tool       |
| MySQL   | 8.0.42  | Database         |
| MyBatis | 3.5+    | SQL Mapper       |
| Spring Boot | 3.1+ | Framework       |
| FastAPI | 0.104+  | Python Web Framework |
| JWT     | -       | Authentication   |
| Redis   | 7.0+    | Cache & Session  |
| Jenkins | 2.400+  | CI/CD           |
| Docker  | 20.10+  | Containerization |
| Swagger | 3.0+    | API Documentation|
| GitLab  | -       | Version Control  |

<!-- 필수 항목 -->

## 개발 환경 구성

Windows 기준 개발 환경 구성 설명

### 1. OpenJDK 설치
1. 17 LTS 설치 파일 다운로드 및 실행
   - https://adoptium.net/temurin/releases/?package=jdk&version=17
2. 설치 후 명령 프롬프트(cmd) 확인
   ```
   > java -version
   ```
   출력 예)
   ```
   openjdk version "17.0.15" 2024-04-16
   OpenJDK Runtime Environment Temurin-17.0.15+9 (build 17.0.15+9)
   OpenJDK 64-Bit Server VM Temurin-17.0.15+9 (build 17.0.15+9, mixed mode, sharing)
   ```

### 2. Maven 설치
1. Apache Maven 다운로드 및 설치
   - https://maven.apache.org/download.cgi
2. 환경변수 설정 후 확인
   ```
   > mvn -version
   ```

### 3. 데이터베이스 구성 *(이미 설치되어 있거나 원격 DB를 사용하는 경우 설치 부분 생략)*
1. **MySQL 설치**
   - MySQL 다운로드 사이트에서 Community 설치 파일 다운로드 및 실행
   - https://dev.mysql.com/downloads/installer/
   - MySQL Server, MySQL Shell을 포함하여 설치

2. **DB 및 계정 생성**
   - MySQL Shell 실행
     ```
     MySQL  JS > \connect root@localhost
     MySQL  localhost:3306  JS > \sql
     ```
   - DB 생성
     ```sql
     create database IF NOT EXISTS `ssafy_web_db` collate utf8mb4_general_ci;
     ```
   - User 생성
     ```sql
     create user 'ssafy'@'localhost' identified by '비밀번호';
     grant all privileges on ssafy_web_db.* to 'ssafy'@'localhost';
     flush privileges;
     ```

### 4. Redis 설치 (선택사항)
1. **Windows용 Redis 설치**
   - Redis for Windows 다운로드: https://github.com/microsoftarchive/redis/releases
   - 또는 Docker를 통한 설치 권장:
     ```bash
     docker run -d -p 6379:6379 --name redis redis:7.0-alpine
     ```

### 5. Docker 설치 (선택사항)
1. Docker Desktop for Windows 설치
   - https://www.docker.com/products/docker-desktop
2. 설치 후 확인
   ```
   > docker --version
   > docker-compose --version
   ```

### 6. Python 환경 구성 (FastAPI용)
1. **Python 설치**
   - Python 3.9+ 설치: https://www.python.org/downloads/
2. **가상환경 생성 및 FastAPI 설치**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   pip install fastapi[all] uvicorn
   ```

### 7. IDE 설치
1. **IntelliJ IDEA 설치**
   - JetBrains 공식 사이트에서 IntelliJ IDE Community Edition 설치 파일 다운로드 및 실행
   - https://www.jetbrains.com/ko-kr/idea/download

2. **필수 플러그인 설치**
   - MyBatis Plugin
   - Docker Plugin
   - Python Plugin (FastAPI 개발용)

### 8. 스켈레톤 다운로드 및 실행

1. **프로젝트 다운로드**
   ```bash
   git clone <GitLab repo URL>
   ```

2. **IntelliJ 프로젝트 열기**
   - IntelliJ의 [File] - [Open]에서 backend 폴더 선택 후 [OK]

3. **설정 파일 수정**
   - `src/main/resources/application.properties` 수정
     ```properties
     # Database Configuration
     spring.datasource.url=jdbc:mysql://localhost:3306/ssafy_web_db
     spring.datasource.username=ssafy
     spring.datasource.password=<비밀번호>
     spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
     
     # MyBatis Configuration
     mybatis.mapper-locations=classpath:mapper/*.xml
     mybatis.type-aliases-package=com.ssafy.db.entity
     
     # Redis Configuration (선택사항)
     spring.redis.host=localhost
     spring.redis.port=6379
     
     # JWT Configuration
     jwt.secret=<JWT_SECRET_KEY>
     jwt.expiration=86400000
     
     # Swagger Configuration
     springdoc.api-docs.path=/api-docs
     springdoc.swagger-ui.path=/swagger-ui.html
     ```

4. **Maven 의존성 설치**
   ```bash
   mvn clean install
   ```

5. **애플리케이션 실행**
   - [Gradle Tasks] 탭의 [Run Gradle Tasks] 선택하여 실행
   - 또는 명령어로 실행:
     ```bash
     mvn spring-boot:run
     ```

6. **FastAPI 서버 실행 (별도 터미널)**
   ```bash
   cd fastapi-server
   uvicorn main:app --reload --port 8001
   ```

### 9. Docker를 이용한 실행 (선택사항)

1. **Docker Compose 실행**
   ```bash
   docker-compose up -d
   ```

2. **개별 컨테이너 실행**
   ```bash
   # MySQL
   docker run -d -p 3306:3306 --name mysql -e MYSQL_ROOT_PASSWORD=root mysql:8.0.42
   
   # Redis
   docker run -d -p 6379:6379 --name redis redis:7.0-alpine
   ```

## 디렉토리 구조

```
.
├── backend/                    /* Spring Boot Backend */
│   └── src/main
│       ├── java/com/ssafy
│       │   ├── GroupCallApplication.java
│       │   ├── api/           /* REST API 컨트롤러, 서비스, 요청/응답 모델 */
│       │   │   ├── controller/
│       │   │   │   ├── AuthController.java
│       │   │   │   └── UserController.java
│       │   │   ├── request/
│       │   │   │   ├── UserLoginPostReq.java
│       │   │   │   └── UserRegisterPostReq.java
│       │   │   ├── response/
│       │   │   │   ├── UserLoginPostRes.java
│       │   │   │   └── UserRes.java
│       │   │   └── service/
│       │   │       ├── UserService.java
│       │   │       └── UserServiceImpl.java
│       │   ├── common/        /* 공용 유틸, 응답 모델, 인증, 예외처리 */
│       │   │   ├── auth/
│       │   │   │   ├── JwtAuthenticationFilter.java
│       │   │   │   ├── SsafyUserDetailService.java
│       │   │   │   └── SsafyUserDetails.java
│       │   │   ├── exception/handler/
│       │   │   │   └── NotFoundHandler.java
│       │   │   ├── model/response/
│       │   │   │   └── BaseResponseBody.java
│       │   │   └── util/
│       │   │       ├── JwtTokenUtil.java
│       │   │       ├── RedisUtil.java
│       │   │       └── ResponseBodyWriteUtil.java
│       │   ├── config/        /* WebMvc, JPA, Security, Swagger, Redis 설정 */
│       │   │   ├── JpaConfig.java
│       │   │   ├── SecurityConfig.java
│       │   │   ├── SwaggerConfig.java
│       │   │   ├── RedisConfig.java
│       │   │   └── WebMvcConfig.java
│       │   └── db/           /* DB 모델 정의 및 MyBatis 매퍼 */
│       │       ├── entity/
│       │       │   ├── BaseEntity.java
│       │       │   └── User.java
│       │       ├── mapper/    /* MyBatis Mapper 인터페이스 */
│       │       │   └── UserMapper.java
│       │       └── repository/
│       │           ├── UserRepository.java
│       │           └── UserRepositorySupport.java
│       └── resources/
│           ├── application.properties
│           ├── mapper/        /* MyBatis XML 매퍼 파일 */
│           │   └── UserMapper.xml
│           └── static/
├── fastapi-server/            /* FastAPI Python Server */
│   ├── main.py
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── api/
│   │   ├── models/
│   │   └── utils/
│   └── tests/
├── docker-compose.yml         /* Docker 컨테이너 설정 */
├── Dockerfile                 /* Spring Boot 컨테이너 설정 */
├── Jenkinsfile               /* Jenkins CI/CD 파이프라인 */
└── README.md
```

## API 문서

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **API Docs**: http://localhost:8080/api-docs
- **FastAPI Docs**: http://localhost:8001/docs

## 주요 엔드포인트

### Spring Boot (Port 8080)
- `POST /api/auth/login` - 사용자 로그인 (JWT 토큰 발급)
- `POST /api/auth/register` - 사용자 회원가입
- `GET /api/users/me` - 현재 사용자 정보 조회

### FastAPI (Port 8001)
- `GET /` - Health Check
- `POST /api/v1/analysis` - 데이터 분석 API

## 환경별 설정

### 개발 환경 (application-dev.properties)
```properties
spring.profiles.active=dev
logging.level.com.ssafy=DEBUG
```

### 운영 환경 (application-prod.properties)
```properties
spring.profiles.active=prod
logging.level.root=INFO
```

## CI/CD 파이프라인

Jenkins를 통한 자동 배포 파이프라인이 구성되어 있습니다.

1. **GitLab Push** → **Jenkins Webhook 트리거**
2. **빌드 및 테스트** → **Docker 이미지 생성**
3. **배포** → **운영 서버 업데이트**

## 문제 해결

### 일반적인 문제들
1. **포트 충돌**: 8080, 8001 포트가 사용 중인 경우
2. **데이터베이스 연결 실패**: MySQL 서비스 상태 확인
3. **Redis 연결 실패**: Redis 서버 실행 상태 확인

### 로그 확인
```bash
# Spring Boot 로그
tail -f logs/spring-boot-app.log

# FastAPI 로그
tail -f logs/fastapi-app.log
```