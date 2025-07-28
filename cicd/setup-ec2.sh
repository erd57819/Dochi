#!/bin/bash

# EC2 서버 초기 설정 스크립트 (Ubuntu 22.04 LTS 기준)
# 사용법: sudo ./setup-ec2.sh

set -e

echo "=== DOCHI 프로젝트 EC2 서버 설정 시작 ==="

# 시스템 업데이트
echo "시스템 패키지 업데이트 중..."
apt update && apt upgrade -y

# 필수 패키지 설치
echo "필수 패키지 설치 중..."
apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    tree \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    fail2ban \
    ufw \
    certbot \
    nginx

# Docker 설치
echo "Docker 설치 중..."
# Docker 공식 GPG 키 추가
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Docker 저장소 추가
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker 설치
apt update
apt install -y docker-ce docker-ce-cli containerd.io

# Docker 서비스 시작 및 자동 시작 설정
systemctl start docker
systemctl enable docker

# Docker Compose 설치
echo "Docker Compose 설치 중..."
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep -Po '"tag_name": "\K.*?(?=")')
curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 사용자를 docker 그룹에 추가
echo "사용자를 docker 그룹에 추가 중..."
usermod -aG docker $SUDO_USER

# Node.js 설치 (Jenkins에서 프론트엔드 빌드용)
echo "Node.js 설치 중..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Java 설치 (Jenkins용)
echo "Java 설치 중..."
apt install -y openjdk-17-jdk

# 방화벽 설정
echo "방화벽 설정 중..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8090/tcp  # Jenkins

# Fail2Ban 설정
echo "Fail2Ban 설정 중..."
systemctl start fail2ban
systemctl enable fail2ban

# 스왑 파일 생성 (메모리 부족 방지)
echo "스왑 파일 생성 중..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
fi

# 디렉토리 구조 생성
echo "프로젝트 디렉토리 생성 중..."
PROJECT_DIR="/home/$SUDO_USER/dochi"
mkdir -p $PROJECT_DIR/{logs,backups,ssl,nginx,mysql/{init,conf}}
chown -R $SUDO_USER:$SUDO_USER $PROJECT_DIR

# Docker 로그 로테이션 설정
echo "Docker 로그 로테이션 설정 중..."
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

systemctl restart docker

# 시스템 모니터링 설정
echo "시스템 모니터링 설정 중..."
cat > /etc/cron.d/system-monitor << EOF
# 매 5분마다 시스템 상태 체크
*/5 * * * * root /usr/bin/docker stats --no-stream >> /var/log/docker-stats.log 2>&1
# 매일 자정에 로그 정리
0 0 * * * root find /var/log -name "*.log" -mtime +7 -delete
EOF

# SSL 인증서 자동 갱신 설정
echo "SSL 인증서 자동 갱신 설정 중..."
cat > /etc/cron.d/certbot-renew << EOF
# 매일 새벽 2시에 SSL 인증서 갱신 체크
0 2 * * * root /usr/bin/certbot renew --quiet --post-hook "docker-compose -f $PROJECT_DIR/docker-compose.yml restart nginx"
EOF

# 시스템 리소스 모니터링 스크립트
cat > $PROJECT_DIR/monitor.sh << 'EOF'
#!/bin/bash

# 시스템 리소스 모니터링 스크립트

echo "=== 시스템 상태 모니터링 ==="
echo "시간: $(date)"
echo ""

echo "=== CPU 사용률 ==="
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print "CPU 사용률: " $1 "%"}'

echo ""
echo "=== 메모리 사용률 ==="
free -h | awk 'NR==2{printf "메모리 사용률: %.2f%%\n", $3*100/$2}'

echo ""
echo "=== 디스크 사용률 ==="
df -h | grep -E '^/dev/' | awk '{print $5 " " $1}' | sort -rn

echo ""
echo "=== Docker 컨테이너 상태 ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== 네트워크 연결 ==="
ss -tuln | grep -E ':80|:443|:8080|:3306|:6379'

echo ""
echo "=== 최근 시스템 로그 ==="
journalctl -n 5 --no-pager
EOF

chmod +x $PROJECT_DIR/monitor.sh
chown $SUDO_USER:$SUDO_USER $PROJECT_DIR/monitor.sh

# 환경 파일 템플릿 생성
cat > $PROJECT_DIR/.env.template << 'EOF'
# 데이터베이스 설정
DB_PASSWORD=your_secure_db_password
MYSQL_ROOT_PASSWORD=your_secure_root_password

# JWT 설정
JWT_SECRET=your_jwt_secret_key_min_32_characters

# 도메인 설정
DOMAIN=your-domain.com

# 환경 설정
ENVIRONMENT=production

# Docker 이미지 태그
FRONTEND_IMAGE_TAG=latest
BACKEND_IMAGE_TAG=latest
EOF

chown $SUDO_USER:$SUDO_USER $PROJECT_DIR/.env.template

# 보안 강화 설정
echo "보안 설정 강화 중..."

# SSH 보안 설정
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

# 시스템 업데이트 자동화
cat > /etc/cron.d/auto-updates << EOF
# 매주 일요일 새벽 3시에 보안 업데이트 자동 설치
0 3 * * 0 root apt update && apt upgrade -y
EOF

# Docker 컨테이너 자동 재시작 설정
echo "Docker 컨테이너 헬스체크 스크립트 생성 중..."
cat > $PROJECT_DIR/healthcheck.sh << 'EOF'
#!/bin/bash

# Docker 컨테이너 헬스체크 및 자동 재시작 스크립트

PROJECT_DIR="/home/ubuntu/dochi"
LOG_FILE="$PROJECT_DIR/logs/healthcheck.log"

# 로그 함수
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# 컨테이너 상태 확인 및 재시작
check_and_restart() {
    local container_name=$1
    local health_url=$2

    # 컨테이너가 실행 중인지 확인
    if ! docker ps | grep -q "$container_name"; then
        log "WARNING: $container_name 컨테이너가 실행되지 않음"
        cd "$PROJECT_DIR"
        docker-compose up -d "$container_name"
        log "INFO: $container_name 컨테이너 재시작 시도"
        return
    fi

    # 헬스체크 URL이 제공된 경우 HTTP 상태 확인
    if [ -n "$health_url" ]; then
        if ! curl -f -s "$health_url" > /dev/null 2>&1; then
            log "WARNING: $container_name 헬스체크 실패 - $health_url"
            cd "$PROJECT_DIR"
            docker-compose restart "$container_name"
            log "INFO: $container_name 컨테이너 재시작"
        fi
    fi
}

# 각 서비스 확인
check_and_restart "dochi-backend" "http://localhost:8080/actuator/health"
check_and_restart "dochi-frontend" "http://localhost:3000"
check_and_restart "dochi-mysql"
check_and_restart "dochi-redis"
check_and_restart "dochi-nginx" "http://localhost"
EOF

chmod +x $PROJECT_DIR/healthcheck.sh
chown $SUDO_USER:$SUDO_USER $PROJECT_DIR/healthcheck.sh

# 헬스체크 크론탭 등록
cat > /etc/cron.d/docker-healthcheck << EOF
# 매 5분마다 Docker 컨테이너 헬스체크
*/5 * * * * $SUDO_USER $PROJECT_DIR/healthcheck.sh
EOF

echo "=== 설정 완료 ==="
echo ""
echo "다음 단계:"
echo "1. 로그아웃 후 다시 로그인 (docker 그룹 적용)"
echo "2. 프로젝트 클론: git clone <your-repo> $PROJECT_DIR"
echo "3. 환경 설정: cp $PROJECT_DIR/.env.template $PROJECT_DIR/.env"
echo "4. 환경 변수 수정: vi $PROJECT_DIR/.env"
echo "5. SSL 인증서 발급: certbot --nginx -d your-domain.com"
echo "6. 배포 실행: cd $PROJECT_DIR && ./deploy.sh"
echo ""
echo "유용한 명령어:"
echo "- 시스템 모니터링: $PROJECT_DIR/monitor.sh"
echo "- Docker 상태 확인: docker-compose ps"
echo "- 로그 확인: docker-compose logs -f [service_name]"
echo "- 방화벽 상태: ufw status"
echo ""
echo "보안 주의사항:"
echo "- .env 파일의 패스워드를 반드시 변경하세요"
echo "- SSH 키 기반 인증을 사용하세요"
echo "- 정기적으로 시스템 업데이트를 확인하세요"
echo ""

# 설치 정보 저장
cat > $PROJECT_DIR/installation-info.txt << EOF
DOCHI 프로젝트 EC2 설정 완료
설치 날짜: $(date)
서버 정보: $(hostname) - $(lsb_release -d | cut -f2)
Docker 버전: $(docker --version)
Docker Compose 버전: $(docker-compose --version)
Node.js 버전: $(node --version)
Java 버전: $(java -version 2>&1 | head -n1)

설정된 서비스:
- Docker & Docker Compose
- Node.js 18
- OpenJDK 17
- Nginx
- UFW (방화벽)
- Fail2Ban
- SSL (Certbot)
- 자동 헬스체크
- 로그 로테이션

포트 정보:
- 80: HTTP (Nginx)
- 443: HTTPS (Nginx)
- 8090: Jenkins
- 3000: Frontend (내부)
- 8080: Backend (내부)
- 3306: MySQL (내부)
- 6379: Redis (내부)
EOF

chown $SUDO_USER:$SUDO_USER $PROJECT_DIR/installation-info.txt

echo "설치 정보가 $PROJECT_DIR/installation-info.txt에 저장되었습니다."
echo ""
echo "🎉 EC2 서버 설정이 완료되었습니다!"