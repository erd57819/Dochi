pipeline {
    agent any

    tools {
        maven 'maven'
        nodejs 'nodejs'
    }

    parameters {
        choice(
            name: 'DEPLOY_MODE',
            choices: ['QUICK', 'FULL', 'APP_ONLY'],
            description: 'QUICK: 앱만 재배포, FULL: 전체 재시작, APP_ONLY: DB 유지하고 앱만'
        )
        
        booleanParam(
            name: 'SKIP_MYSQL',
            defaultValue: true,
            description: 'MySQL 재시작 건너뛰기'
        )
        
        booleanParam(
            name: 'SKIP_REDIS',
            defaultValue: false,
            description: 'Redis 재시작 건너뛰기'
        )
    }

    environment {
        DOCKERHUB_USERNAME = 'crew8264'
        BE_IMAGE = "${DOCKERHUB_USERNAME}/ssafy-dochi-be:latest"
        FE_IMAGE = "${DOCKERHUB_USERNAME}/ssafy-dochi-fe:latest"
        DOCKER_BUILDKIT = '1'
        COMPOSE_DOCKER_CLI_BUILD = '1'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {
        // ===== 1단계: 초기화 =====
        stage('Initialize') {
            steps {
                echo "🚀 배포 시작 - 모드: ${params.DEPLOY_MODE}"
                sh '''
                    echo "현재 실행 중인 컨테이너:"
                    docker ps --format "table {{.Names}}\t{{.Status}}"
                '''
            }
        }

        // ===== 2단계: 인프라 정리 (조건부) =====
        stage('Clean Infrastructure') {
            when {
                expression { params.DEPLOY_MODE == 'FULL' }
            }
            steps {
                echo "🧹 전체 인프라 정리..."
                sh '''
                    docker-compose down --remove-orphans || true
                    docker network rm dochi-network 2>/dev/null || true
                    docker volume prune -f || true
                    echo "✅ 정리 완료"
                '''
            }
        }

        // ===== 3단계: Git & Credentials =====
        stage('Prepare Source') {
            steps {
                echo "📥 소스 코드 준비..."
                
                git credentialsId: '8981d002-36d7-41a2-a36d-c3ec2add7a5b',
                    url: 'https://lab.ssafy.com/s13-webmobile1-sub1/S13P11C209.git',
                    branch: 'master'
                
                withCredentials([
                    file(credentialsId: 'GOOGLE-SERVICE-ACCOUNT', variable: 'JSON_PATH')
                ]) {
                    sh '''
                        cp "$JSON_PATH" google-service-account.json
                        chmod 644 google-service-account.json
                        echo "✅ 인증 파일 준비 완료"
                    '''
                }
            }
        }

        // ===== 4단계: Backend JAR 빌드 =====
        stage('Build Backend JAR') {
            steps {
                echo "🔨 Backend JAR 빌드..."
                dir('SSAFY-DOCHI-BE') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        // ===== 5단계: Docker 로그인 =====
        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-hub',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                }
            }
        }

        // ===== 6단계: 데이터베이스 (조건부) =====
        stage('Database Setup') {
            when {
                expression { !params.SKIP_MYSQL }
            }
            steps {
                echo "🗄️ MySQL 시작..."
                sh '''
                    docker-compose up -d mysql
                    
                    echo "MySQL 준비 대기..."
                    for i in {1..30}; do
                        docker exec dochi-mysql mysqladmin ping -h localhost --silent 2>/dev/null && {
                            echo "✅ MySQL ready"
                            break
                        }
                        sleep 2
                    done
                '''
            }
        }

        // ===== 7단계: Redis (조건부) =====
        stage('Cache Setup') {
            when {
                expression { !params.SKIP_REDIS }
            }
            steps {
                echo "💾 Redis 시작..."
                sh '''
                    docker-compose up -d redis redis-commander
                    
                    echo "Redis 준비 대기..."
                    for i in {1..15}; do
                        docker exec dochi-redis redis-cli ping 2>/dev/null | grep -q PONG && {
                            echo "✅ Redis ready"
                            break
                        }
                        sleep 1
                    done
                '''
            }
        }

        // ===== 8단계: 기본 서비스 확인 =====
        stage('Ensure Basic Services') {
            steps {
                echo "🔍 필수 서비스 확인..."
                sh '''
                    # MySQL이 없으면 시작
                    if ! docker ps | grep -q dochi-mysql; then
                        echo "MySQL 시작..."
                        docker-compose up -d mysql
                        sleep 10
                    fi
                    
                    # Redis가 없으면 시작
                    if ! docker ps | grep -q dochi-redis; then
                        echo "Redis 시작..."
                        docker-compose up -d redis redis-commander
                        sleep 5
                    fi
                    
                    # Kafka가 없으면 시작
                    if ! docker ps | grep -q dochi-kafka; then
                        echo "Kafka 시작..."
                        docker-compose up -d zookeeper kafka
                        sleep 15
                    fi
                    
                    # OpenVidu가 없으면 시작
                    if ! docker ps | grep -q dochi-openvidu; then
                        echo "OpenVidu 시작..."
                        docker-compose up -d openvidu-server
                        sleep 10
                    fi
                    
                    echo "✅ 모든 기본 서비스 준비"
                '''
            }
        }

        // ===== 9단계: AI Service 배포 =====
        stage('Deploy AI Service') {
            steps {
                echo "🤖 AI Service 배포..."
                sh '''
                    docker-compose stop ai-service || true
                    docker-compose rm -f ai-service || true
                    docker-compose build ai-service
                    docker-compose up -d ai-service
                    
                    echo "AI Service 헬스체크..."
                    for i in {1..30}; do
                        curl -sf http://localhost:8002/health >/dev/null 2>&1 && {
                            echo "✅ AI Service healthy"
                            break
                        }
                        sleep 2
                    done
                '''
            }
        }

        // ===== 10단계: Backend 배포 =====
        stage('Deploy Backend') {
            steps {
                echo "⚙️ Backend 배포..."
                sh '''
                    docker-compose stop backend || true
                    docker-compose rm -f backend || true
                    docker-compose build backend
                    docker-compose up -d backend
                    
                    echo "Backend 헬스체크..."
                    for i in {1..40}; do
                        curl -sf http://localhost:8080/actuator/health >/dev/null 2>&1 && {
                            echo "✅ Backend healthy"
                            break
                        }
                        sleep 3
                    done
                '''
            }
        }

        // ===== 11단계: Frontend 배포 =====
        stage('Deploy Frontend') {
            steps {
                echo "🎨 Frontend 배포..."
                sh '''
                    docker-compose stop frontend || true
                    docker-compose rm -f frontend || true
                    docker-compose build frontend
                    docker-compose up -d frontend
                    
                    echo "✅ Frontend deployed"
                '''
            }
        }

        // ===== 12단계: Nginx 배포 =====
        stage('Deploy Nginx') {
            steps {
                echo "🌐 Nginx 배포..."
                sh '''
                    docker-compose stop nginx || true
                    docker-compose rm -f nginx || true
                    docker-compose build nginx
                    docker-compose up -d nginx
                    
                    sleep 5
                    if docker ps | grep -q dochi-nginx; then
                        echo "✅ Nginx running"
                    else
                        echo "❌ Nginx 시작 실패"
                        docker logs dochi-nginx --tail 30
                    fi
                '''
            }
        }

        // ===== 13단계: 검증 =====
        stage('Verify Deployment') {
            steps {
                echo "🔍 배포 검증..."
                sh '''
                    echo "===== 서비스 상태 ====="
                    docker ps --format "table {{.Names}}\t{{.Status}}"
                    
                    echo ""
                    echo "===== 엔드포인트 테스트 ====="
                    curl -sf http://localhost:8080/actuator/health && echo "✅ Backend: OK" || echo "❌ Backend: Failed"
                    curl -sf http://localhost:8002/health && echo "✅ AI: OK" || echo "❌ AI: Failed"
                    curl -sf http://localhost && echo "✅ Frontend: OK" || echo "❌ Frontend: Failed"
                    
                    echo ""
                    echo "✅ 배포 완료!"
                '''
            }
        }

        // ===== 14단계: Docker Hub 푸시 =====
        stage('Push Images') {
            when {
                expression { params.DEPLOY_MODE != 'QUICK' }
            }
            steps {
                echo "📤 Docker Hub 푸시..."
                sh '''
                    docker build -t ${BE_IMAGE} ./SSAFY-DOCHI-BE
                    docker build -t ${FE_IMAGE} ./SSAFY-DOCHI-FE
                    
                    docker push ${BE_IMAGE}
                    docker push ${FE_IMAGE}
                    
                    echo "✅ 이미지 푸시 완료"
                '''
            }
        }
    }

    post {
        success {
            echo """
            ========================================
            🎉 배포 성공!
            배포 모드: ${params.DEPLOY_MODE}
            빌드 번호: ${BUILD_NUMBER}
            ========================================
            """
        }
        
        failure {
            echo "❌ 배포 실패!"
            sh '''
                echo "===== 실패한 컨테이너 ====="
                docker ps -a --filter "status=exited" --format "table {{.Names}}\t{{.Status}}"
            '''
        }
    }
}