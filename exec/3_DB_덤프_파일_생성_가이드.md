# 참견도치 - DB 덤프 파일 생성 가이드

## 1. DB 덤프 파일 개요

### 목적
- 개발 및 시연용 데이터베이스 백업
- 새로운 환경에서의 빠른 데이터베이스 복원
- 데이터 구조와 샘플 데이터 제공

### 포함 내용
- 전체 테이블 구조 (DDL)
- 기본 샘플 데이터 (DML)
- 인덱스 및 제약조건
- 트리거 및 이벤트

## 2. DB 덤프 파일 생성 방법

### 전체 데이터베이스 덤프 생성
```bash
# 구조와 데이터 모두 포함
mysqldump -u root -p --single-transaction --routines --triggers dochi > exec/dochi_complete_dump.sql

# 구조만 덤프 (테이블 스키마만)
mysqldump -u root -p --no-data --routines --triggers dochi > exec/dochi_schema_only.sql

# 데이터만 덤프 (INSERT 문만)
mysqldump -u root -p --no-create-info --complete-insert dochi > exec/dochi_data_only.sql
```

### Docker 환경에서 덤프 생성
```bash
# Docker 컨테이너에서 덤프 생성
docker exec dochi-mysql mysqldump -u root -p{password} --single-transaction --routines --triggers dochi > exec/dochi_docker_dump.sql

# 또는 컨테이너 내부로 접속하여 생성
docker exec -it dochi-mysql bash
mysqldump -u root -p --single-transaction --routines --triggers dochi > /tmp/dochi_dump.sql
exit
docker cp dochi-mysql:/tmp/dochi_dump.sql ./exec/
```

## 3. DB 덤프 파일 복원 방법

### 새로운 데이터베이스에 복원
```bash
# 1. 데이터베이스 생성
mysql -u root -p -e "CREATE DATABASE dochi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. 덤프 파일 복원
mysql -u root -p dochi < exec/dochi_complete_dump.sql

# 3. 복원 확인
mysql -u root -p dochi -e "SHOW TABLES; SELECT COUNT(*) as user_count FROM users;"
```

### Docker 환경에서 복원
```bash
# Docker 컨테이너에 덤프 파일 복사
docker cp exec/dochi_complete_dump.sql dochi-mysql:/tmp/

# 컨테이너에서 복원 실행
docker exec -i dochi-mysql mysql -u root -p{password} dochi < /tmp/dochi_complete_dump.sql
```

## 4. 현재 사용 가능한 SQL 파일

### 1. 초기 스키마 파일
**파일 위치**: `SSAFY-DOCHI-BE/src/main/resources/static/script.sql`
**내용**: 
- 전체 테이블 구조 정의
- 기본 샘플 데이터
- 제약조건 및 인덱스
- 이벤트 스케줄러 설정

**사용 방법**:
```bash
mysql -u root -p dochi < SSAFY-DOCHI-BE/src/main/resources/static/script.sql
```

### 2. 테이블 드롭 파일
**파일 위치**: `drop_all_tables.sql`
**내용**: 모든 테이블을 안전하게 삭제하는 스크립트

**사용 방법**:
```bash
mysql -u root -p dochi < drop_all_tables.sql
```

### 3. 마이그레이션 파일
**파일 위치**: `SSAFY-DOCHI-BE/src/main/resources/static/migration_chat_rooms_session_id.sql`
**내용**: 채팅방 테이블에 session_id 컬럼 추가

## 5. 주요 테이블 구조 요약

### 사용자 관련 테이블
```sql
-- 사용자 기본 정보
users (id, user_id, name, nickname, email, password, ...)

-- 이메일 인증
email_verification (id, email, verification_code, expires_at, ...)

-- 사용자 세션
user_sessions (id, session_id, user_id, expires_at, ...)
```

### 갈등 관리 테이블
```sql
-- 갈등 카드
user_conflicts (id, user_id, title, description, conflict_type, ...)

-- AI 분석 결과
ai_analysis_results (id, conflict_id, user_id, emotion_analysis, ...)

-- 분석 세션
sessions (id, conflict_id, status, started_at, ended_at)
```

### 화상통화 관련 테이블
```sql
-- 영상통화방
video_call_rooms (id, room_code, host_user_id, guest_user_id, ...)

-- 통화 세션
video_call_sessions (id, room_id, conflict_id, duration_seconds, ...)

-- 감정 분석 로그
emotion_analysis_logs (id, session_id, user_id, analysis_timestamp, ...)

-- STT 변환 결과
stt_transcripts (id, session_id, user_id, speaker_name, text, ...)
```

### 커뮤니티 테이블
```sql
-- 게시글
community_posts (id, user_id, category, title, content, ...)

-- 댓글
comments (id, post_id, user_id, parent_comment_id, content, ...)

-- 좋아요/싫어요
post_likes (id, post_id, user_id, like_type, ...)
comment_likes (id, comment_id, user_id, like_type, ...)
```

### 챗봇 테이블
```sql
-- 채팅방
chat_rooms (id, user_id, title, session_id, created_at, ...)

-- 채팅 메시지
chat_messages (id, chat_room_id, user_id, sender_type, message, ...)
```

## 6. 샘플 데이터 정보

### 기본 사용자 계정
```sql
-- 테스트 사용자 1
user_id: testuser1
email: testuser1@example.com
password: password123 (BCrypt 해시됨)
role: USER

-- 테스트 사용자 2  
user_id: testuser2
email: testuser2@example.com
password: password123 (BCrypt 해시됨)
role: USER

-- 관리자 계정
user_id: admin
email: admin@example.com
password: password123 (BCrypt 해시됨)
role: ADMIN
```

### 갈등 카드 샘플
- 동료와의 업무 분담 문제 (WORK 카테고리)
- 룸메이트와의 생활 패턴 차이 (FRIEND 카테고리)

### 커뮤니티 게시글 샘플
- 직장 상사와의 갈등 해결 방법 (ADVICE_REQUEST)
- 친구와의 오해 해결 후기 (SUCCESS_STORIES)

## 7. 데이터베이스 설정 정보

### 연결 정보
```properties
# 개발환경
DB_HOST=localhost
DB_PORT=3306
DB_NAME=dochi
DB_USERNAME=dochi_user
DB_PASSWORD=your_password

# 연결 URL
jdbc:mysql://localhost:3306/dochi?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
```

### 문자셋 설정
```sql
-- 데이터베이스 문자셋
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci

-- 테이블별 문자셋 통일
ALTER DATABASE dochi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 8. 백업 및 복원 자동화 스크립트

### 백업 스크립트 (backup_db.sh)
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backup"
DB_NAME="dochi"

mkdir -p $BACKUP_DIR

echo "Starting database backup..."
mysqldump -u root -p --single-transaction --routines --triggers $DB_NAME > $BACKUP_DIR/dochi_backup_$DATE.sql

if [ $? -eq 0 ]; then
    echo "Backup completed: $BACKUP_DIR/dochi_backup_$DATE.sql"
    
    # 7일 이상 된 백업 파일 삭제
    find $BACKUP_DIR -name "dochi_backup_*.sql" -mtime +7 -delete
else
    echo "Backup failed!"
    exit 1
fi
```

### 복원 스크립트 (restore_db.sh)
```bash
#!/bin/bash
if [ $# -eq 0 ]; then
    echo "Usage: $0 <dump_file>"
    exit 1
fi

DUMP_FILE=$1
DB_NAME="dochi"

echo "Restoring database from $DUMP_FILE..."
mysql -u root -p $DB_NAME < $DUMP_FILE

if [ $? -eq 0 ]; then
    echo "Database restored successfully!"
else
    echo "Restore failed!"
    exit 1
fi
```

## 9. 주의사항

### 덤프 파일 관리
- 덤프 파일에는 민감한 정보가 포함될 수 있으므로 보안에 주의
- 정기적인 백업 수행 권장 (일일/주간)
- 백업 파일의 무결성 검증 필요

### 복원 시 주의사항
- 기존 데이터는 모두 덮어씌워짐
- 복원 전 현재 데이터 백업 권장
- 외래키 제약조건으로 인한 순서 문제 가능성

### 용량 관리
- chat_messages 테이블은 시간이 지나면서 크게 증가할 수 있음
- 이벤트 스케줄러로 6개월 이상 된 채팅 데이터 자동 삭제 설정됨
- 필요 시 파티셔닝 고려

---

**생성 파일 목록**:
- `exec/dochi_complete_dump.sql` - 전체 덤프 (구조 + 데이터)
- `exec/dochi_schema_only.sql` - 스키마만
- `exec/dochi_data_only.sql` - 데이터만