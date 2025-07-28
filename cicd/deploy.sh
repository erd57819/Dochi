#!/bin/bash

# 배포 스크립트
# 사용법: ./deploy.sh [environment] [version]
# 예시: ./deploy.sh production latest

set -e  # 오류 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 변수 설정
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
PROJECT_NAME="dochi"
COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deploy-$(date +%Y%m%d-%H%M%S).log"

# 디렉토리 생성
mkdir -p logs backups

# 로그 시작
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

log_info "=== DOCHI 배포 시작 ==="
log_info "환경: $ENVIRONMENT"
log_info "버전: $VERSION"
log_info "시간: $(date)"

# 환경 검증
validate_environment() {
    log_info "환경 검증 중..."

    # Docker 설치 확인
    if ! command -v docker &> /dev/null; then
        log_error "Docker가 설치되지 않았습니다."
        exit 1
    fi

    # Docker Compose 설치 확인
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose가 설치되지 않았습니다."
        exit 1
    fi

    # 환경 파일 확인
    if [[ ! -f ".env" ]]; then
        log_error ".env 파일이 존재하지 않습니다."
        exit 1
    fi

    # Docker Compose 파일 확인
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "$COMPOSE_FILE 파일이 존재하지 않습니다."
        exit 1
    fi

    log_success "환경 검증 완료"
}

# 백업 생성
create_backup() {
    log_info "데이터베이스 백업 생성 중..."

    BACKUP_FILE="$BACKUP_DIR/mysql-backup-$(date +%Y%m%d-%H%M%S).sql"

    # MySQL 컨테이너가 실행 중인지 확인
    if docker-compose ps mysql | grep -q "Up"; then
        docker-compose exec -T mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" dochi > "$BACKUP_FILE"
        log_success "백업 완료: $BACKUP_FILE"
    else
        log_warning "MySQL 컨테이너가 실행되지 않아 백업을 건너뜁니다."
    fi
}

# 헬스 체크
health_check() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    log_info "$service 헬스 체크 중..."

    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            log_success "$service 헬스 체크 성공"
            return 0
        fi

        log_info "$service 헬스 체크 시도 $attempt/$max_attempts..."
        sleep 10
        ((attempt++))
    done

    log_error "$service 헬스 체크 실패"
    return 1
}

# 롤백 함수
rollback() {
    log_warning "롤백을 시작합니다..."

    # 현재 컨테이너 중지
    docker-compose down

    # 이전 백업에서 복원 (선택사항)
    if [[ -n "$1" ]]; then
        log_info "데이터베이스 롤백: $1"
        docker-compose up -d mysql
        sleep 30
        docker-compose exec -T mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" dochi < "$1"
    fi

    # 이전 버전으로 컨테이너 시작
    docker-compose up -d

    log_warning "롤백 완료"
}

# 배포 함수
deploy() {
    log_info "배포 시작..."

    # 현재 실행 중인 서비스 확인
    log_info "현재 서비스 상태 확인..."
    docker-compose ps

    # 새 이미지 Pull
    log_info "새 Docker 이미지 다운로드 중..."
    docker-compose pull

    # Blue-Green 배포 시뮬레이션 (단순화)
    log_info "서비스 재시작 중..."

    # 데이터베이스와 Redis는 유지하고 애플리케이션만 재시작
    docker-compose up -d --no-deps --force-recreate backend frontend

    # Nginx 재시작 (설정 변경이 있는 경우)
    docker-compose up -d --force-recreate nginx

    log_success "배포 완료"
}

# 스모크 테스트
smoke_test() {
    log_info "스모크 테스트 실행 중..."

    local tests_passed=0
    local total_tests=0

    # 프론트엔드 테스트
    ((total_tests++))
    if curl -f -s "http://localhost" > /dev/null; then
        log_success "✓ 프론트엔드 응답 정상"
        ((tests_passed++))
    else
        log_error "✗ 프론트엔드 응답 실패"
    fi

    # 백엔드 API 테스트
    ((total_tests++))
    if curl -f -s "http://localhost/api/notice" > /dev/null; then
        log_success "✓ 백엔드 API 응답 정상"
        ((tests_passed++))
    else
        log_error "✗ 백엔드 API 응답 실패"
    fi

    # 데이터베이스 연결 테스트
    ((total_tests++))
    if docker-compose exec -T mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1" > /dev/null 2>&1; then
        log_success "✓ 데이터베이스 연결 정상"
        ((tests_passed++))
    else
        log_error "✗ 데이터베이스 연결 실패"
    fi

    # Redis 연결 테스트
    ((total_tests++))
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        log_success "✓ Redis 연결 정상"
        ((tests_passed++))
    else
        log_error "✗ Redis 연결 실패"
    fi

    log_info "스모크 테스트 결과: $tests_passed/$total_tests 통과"

    if [[ $tests_passed -eq $total_tests ]]; then
        log_success "모든 스모크 테스트 통과!"
        return 0
    else
        log_error "일부 스모크 테스트 실패!"
        return 1
    fi
}

# 시스템 정보 수집
collect_system_info() {
    log_info "시스템 정보 수집 중..."

    echo "=== 시스템 정보 ===" >> "$LOG_FILE"
    echo "날짜: $(date)" >> "$LOG_FILE"
    echo "서버: $(hostname)" >> "$LOG_FILE"
    echo "사용자: $(whoami)" >> "$LOG_FILE"
    echo "Docker 버전: $(docker --version)" >> "$LOG_FILE"
    echo "Docker Compose 버전: $(docker-compose --version)" >> "$LOG_FILE"
    echo "디스크 사용량:" >> "$LOG_FILE"
    df -h >> "$LOG_FILE"
    echo "메모리 사용량:" >> "$LOG_FILE"
    free -h >> "$LOG_FILE"
    echo "실행 중인 컨테이너:" >> "$LOG_FILE"
    docker ps >> "$LOG_FILE"
    echo "==================" >> "$LOG_FILE"
}

# 정리 함수
cleanup() {
    log_info "정리 작업 수행 중..."

    # 사용하지 않는 Docker 이미지 제거
    docker image prune -f

    # 사용하지 않는 볼륨 제거 (주의: 데이터 손실 가능)
    # docker volume prune -f

    # 30일 이상 된 백업 파일 제거
    find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete

    # 30일 이상 된 로그 파일 제거
    find "./logs" -name "*.log" -mtime +30 -delete

    log_success "정리 작업 완료"
}

# 메인 실행 함수
main() {
    # 트랩 설정 (스크립트 중단 시 정리)
    trap 'log_error "배포 중단됨"; exit 1' INT TERM

    # 환경 파일 로드
    if [[ -f ".env" ]]; then
        source .env
    fi

    # 단계별 실행
    validate_environment
    collect_system_info

    # 프로덕션 환경에서만 백업 생성
    if [[ "$ENVIRONMENT" == "production" ]]; then
        create_backup
    fi

    # 배포 실행
    if deploy; then
        log_success "배포 단계 완료"

        # 헬스 체크
        if health_check "백엔드" "http://localhost:8080/actuator/health" && \
           health_check "프론트엔드" "http://localhost"; then

            # 스모크 테스트
            if smoke_test; then
                log_success "🎉 배포 성공! 모든 테스트를 통과했습니다."

                # 정리 작업
                cleanup

                # 배포 완료 알림
                echo "배포 정보:"
                echo "- 환경: $ENVIRONMENT"
                echo "- 버전: $VERSION"
                echo "- 시간: $(date)"
                echo "- 로그: $LOG_FILE"
                echo "- 백엔드: http://localhost:8080"
                echo "- 프론트엔드: http://localhost"
                echo "- Jenkins: http://localhost:8090"

            else
                log_error "스모크 테스트 실패"

                # 자동 롤백 (선택사항)
                if [[ "$ENVIRONMENT" == "production" ]]; then
                    log_warning "자동 롤백을 수행합니다..."
                    # rollback "최신_백업_파일_경로"
                fi
                exit 1
            fi
        else
            log_error "헬스 체크 실패"
            exit 1
        fi
    else
        log_error "배포 실패"
        exit 1
    fi
}

# 도움말 출력
show_help() {
    echo "DOCHI 배포 스크립트"
    echo ""
    echo "사용법:"
    echo "  $0 [environment] [version]"
    echo ""
    echo "매개변수:"
    echo "  environment  배포 환경 (기본값: production)"
    echo "  version      배포 버전 (기본값: latest)"
    echo ""
    echo "예시:"
    echo "  $0                          # production 환경에 latest 버전 배포"
    echo "  $0 staging                  # staging 환경에 latest 버전 배포"
    echo "  $0 production v1.2.3       # production 환경에 v1.2.3 버전 배포"
    echo ""
    echo "옵션:"
    echo "  -h, --help                  이 도움말 출력"
    echo "  --rollback [backup_file]    지정된 백업으로 롤백"
    echo "  --status                    현재 서비스 상태 확인"
    echo "  --logs [service]            서비스 로그 확인"
    echo ""
}

# 옵션 처리
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    --rollback)
        rollback "$2"
        exit 0
        ;;
    --status)
        log_info "현재 서비스 상태:"
        docker-compose ps
        exit 0
        ;;
    --logs)
        if [[ -n "$2" ]]; then
            docker-compose logs -f "$2"
        else
            docker-compose logs -f
        fi
        exit 0
        ;;
    *)
        main
        ;;
esac