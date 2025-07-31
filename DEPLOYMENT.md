# 🚀 운영 환경 배포 가이드

## 1. 사전 준비사항

### 필수 환경변수 설정
`.env-prod` 파일의 모든 `your_xxx` 값들을 실제 운영 값으로 변경:

```bash
# 복사하여 실제 값으로 수정
cp .env-prod .env
```

### 중요 변경사항
1. **강력한 비밀번호 설정**
   - `MYSQL_ROOT_PASSWORD`: 최소 16자 이상
   - `JWT_SECRET`: 최소 32자 이상의 랜덤 문자열

2. **실제 도메인 설정**
   - `DOMAIN_OR_PUBLIC_IP`: 실제 서버 도메인/IP
   - `KAKAO_REDIRECT_URI`: https://yourdomain.com/user/kakao

3. **AWS/외부 서비스 키**
   - AWS Access Key, S3 버킷명
   - Kakao API 키 (운영용)
   - Gmail App Password

## 2. 디렉토리 구조 준비

```bash
# 운영 데이터 디렉토리 생성
mkdir -p data/mysql data/redis logs/nginx ssl
```

## 3. SSL 인증서 설정 (선택사항)

### Let's Encrypt 사용 시:
```bash
# 인증서 파일을 ssl/ 디렉토리에 배치
ssl/
├── cert.pem
└── key.pem
```

## 4. 운영 환경 배포

### 개발 → 운영 전환
```bash
# 1. 환경변수 변경
echo "SPRING_PROFILES_ACTIVE=prod" > .env

# 2. 운영 모드로 빌드 및 배포
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 3. 로그 확인
docker-compose logs -f backend
```

### 운영 환경 확인
```bash
# 헬스체크
curl http://localhost:8090/health
curl http://localhost:8080/actuator/health

# 컨테이너 상태 확인
docker-compose ps
```

## 5. 모니터링 및 관리

### 로그 확인
```bash
# 애플리케이션 로그
tail -f logs/application.log

# Nginx 로그
tail -f logs/nginx/access.log
tail -f logs/nginx/error.log
```

### 백업 설정
```bash
# 데이터베이스 백업
docker exec dochi-mysql mysqldump -u root -p dochi > backup_$(date +%Y%m%d).sql

# Redis 백업
docker exec dochi-redis redis-cli BGSAVE
```

## 6. 성능 최적화 확인사항

✅ **데이터베이스**
- Connection Pool 설정 (최대 20개)
- InnoDB Buffer Pool (512MB)
- Slow Query Log 활성화

✅ **애플리케이스**
- JVM 힙 메모리 (512MB-1GB)
- G1GC 사용
- 로그 레벨 INFO

✅ **웹서버**
- Gzip 압축 활성화
- 정적 파일 캐싱 (1년)
- Rate Limiting 적용

✅ **보안**
- 보안 헤더 추가
- SSL/TLS 설정 (선택)
- 숨겨진 파일 접근 차단

## 7. 장애 대응

### 컨테이너 재시작
```bash
# 특정 서비스 재시작
docker-compose restart backend

# 전체 재시작  
docker-compose restart
```

### 롤백
```bash
# 이전 이미지로 롤백
docker-compose down
git checkout previous-commit
docker-compose up -d --build
```

## 8. 추가 권장사항

- **모니터링**: Prometheus + Grafana
- **로그 수집**: ELK Stack
- **CI/CD**: GitHub Actions 자동 배포
- **백업**: 정기 데이터베이스 백업 스크립트
- **스케일링**: Docker Swarm 또는 Kubernetes

---

⚠️ **주의사항**
- `.env-prod` 파일은 절대 Git에 커밋하지 마세요
- 운영 환경에서는 반드시 백업을 수행하세요
- 정기적으로 보안 업데이트를 적용하세요