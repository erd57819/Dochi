pipeline {
    agent any

    tools {
        maven 'maven'
        nodejs 'nodejs'
    }

    parameters {
        choice(
            name: 'DEPLOY_TARGET',
            choices: ['APP_ONLY', 'WITH_CACHE', 'WITH_DB', 'FULL_STACK'],
            description: '''배포 대상 선택:
            APP_ONLY: 앱만 (Backend, Frontend, AI)
            WITH_CACHE: 앱 + Redis
            WITH_DB: 앱 + MySQL + Redis
            FULL_STACK: 모든 서비스 재시작'''
        )
        
        booleanParam(
            name: 'PARALLEL_DEPLOY',
            defaultValue: true,
            description: '서비스 병렬 배포 (더 빠름)'
        )
        
        booleanParam(
            name: 'SKIP_BUILD',
            defaultValue: false,
            description: '이미지 빌드 건너뛰기 (기존 이미지 사용)'
        )
        
        booleanParam(
            name: 'PUSH_TO_HUB',
            defaultValue: false,
            description: 'Docker Hub에 푸시'
        )
    }

    environment {
        DOCKERHUB_USERNAME = 'crew8264'
        BE_IMAGE = "${DOCKERHUB_USERNAME}/ssafy-dochi-be:latest"
        FE_IMAGE = "${DOCKERHUB_USERNAME}/ssafy-dochi-fe:latest"
        DOCKER_BUILDKIT = '1'
        COMPOSE_DOCKER_CLI_BUILD = '1'
        COMPOSE_PARALLEL_LIMIT = '4'
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {
        // ===== 1단계: 초기화 =====
        stage('Initialize') {
            steps {
                echo "🚀 배포 시작"
                echo "📋 배포 대상: ${params.DEPLOY_TARGET}"
                echo "⚡ 병렬 배포: ${params.PARALLEL_DEPLOY}"
                sh '''
                    echo "현재 실행 중인 서비스:"
                    docker ps --format "table {{.Names}}\t{{.Status}}" | head -15
                '''
            }
        }

        // ===== 2단계: 인프라 정리 (FULL_STACK만) =====
        stage('Clean Infrastructure') {
            when {
                expression { params.DEPLOY_TARGET == 'FULL_STACK' }
            }
            steps {
                echo "🧹 전체 인프라 정리..."
                sh '''
                    docker-compose down --remove-orphans || true
                    docker network rm dochi-network 2>/dev/null || true
                    docker system prune -f --volumes || true
                    echo "✅ 정리 완료"
                '''
            }
        }

        // ===== 3단계: 소스 준비 (병렬) =====
        stage('Preparation') {
            parallel {
                stage('Git Clone') {
                    steps {
                        echo "📥 소스 코드 가져오기..."
                        git credentialsId: '8981d002-36d7-41a2-a36d-c3ec2add7a5b',
                            url: 'https://lab.ssafy.com/s13-webmobile1-sub1/S13P11C209.git',
                            branch: 'master'
                    }
                }
                
                stage('Docker Login') {
                    steps {
                        echo "🔐 Docker Hub 로그인..."
                        withCredentials([usernamePassword(
                            credentialsId: 'docker-hub',
                            usernameVariable: 'DOCKER_USER',
                            passwordVariable: 'DOCKER_PASS'
                        )]) {
                            sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                        }
                    }
                }
            }
        }

        // ===== 4단계: 빌드 준비 (병렬) =====
        stage('Build Preparation') {
            when {
                expression { !params.SKIP_BUILD }
            }
            parallel {
                stage('Setup Credentials') {
                    steps {
                        withCredentials([
                            file(credentialsId: 'GOOGLE-SERVICE-ACCOUNT', variable: 'JSON_PATH')
                        ]) {
                            sh '''
                                cp "$JSON_PATH" google-service-account.json
                                chmod 644 google-service-account.json
                                echo "✅ 인증 파일 준비"
                            '''
                        }
                    }
                }
                
                stage('Build Backend JAR') {
                    steps {
                        echo "🔨 Backend JAR 빌드..."
                        dir('SSAFY-DOCHI-BE') {
                            sh 'mvn clean package -DskipTests -T 1C'
                        }
                    }
                }
                
                stage('Prepare Frontend') {
                    steps {
                        echo "📦 Frontend 의존성 설치..."
                        dir('SSAFY-DOCHI-FE') {
                            sh '''
                                if [ -f "package.json" ]; then
                                    npm ci --cache .npm --prefer-offline || npm install
                                fi
                            '''
                        }
                    }
                }
            }
        }

        // ===== 5단계: 인프라 서비스 (조건부 병렬) =====
        stage('Infrastructure Services') {
            when {
                expression { 
                    params.DEPLOY_TARGET == 'WITH_DB' || 
                    params.DEPLOY_TARGET == 'FULL_STACK' ||
                    params.DEPLOY_TARGET == 'WITH_CACHE'
                }
            }
            steps {
                script {
                    def infrastructureStages = [:]
                    
                    // MySQL (WITH_DB, FULL_STACK만)
                    if (params.DEPLOY_TARGET == 'WITH_DB' || params.DEPLOY_TARGET == 'FULL_STACK') {
                        infrastructureStages['MySQL'] = {
                            echo "🗄️ MySQL 시작..."
                            sh '''
                                docker-compose up -d mysql
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
                    
                    // Redis (WITH_CACHE, WITH_DB, FULL_STACK)
                    if (params.DEPLOY_TARGET != 'APP_ONLY') {
                        infrastructureStages['Redis'] = {
                            echo "💾 Redis 시작..."
                            sh '''
                                docker-compose up -d redis redis-commander
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
                    
                    // Kafka (FULL_STACK만)
                    if (params.DEPLOY_TARGET == 'FULL_STACK') {
                        infrastructureStages['Kafka'] = {
                            echo "📨 Kafka 시작..."
                            sh '''
                                docker-compose up -d zookeeper kafka
                                sleep 10
                                for i in {1..20}; do
                                    docker exec dochi-kafka kafka-broker-api-versions.sh \
                                        --bootstrap-server localhost:9092 >/dev/null 2>&1 && {
                                        echo "✅ Kafka ready"
                                        break
                                    }
                                    sleep 2
                                done
                            '''
                        }
                        
                        infrastructureStages['OpenVidu'] = {
                            echo "📹 OpenVidu 시작..."
                            sh '''
                                docker-compose up -d openvidu-server
                                sleep 10
                                echo "✅ OpenVidu started"
                            '''
                        }
                    }
                    
                    if (params.PARALLEL_DEPLOY && infrastructureStages.size() > 0) {
                        parallel infrastructureStages
                    } else {
                        infrastructureStages.each { name, closure ->
                            echo "Sequential: ${name}"
                            closure()
                        }
                    }
                }
            }
        }

        // ===== 6단계: 필수 서비스 확인 =====
        stage('Ensure Required Services') {
            steps {
                echo "🔍 필수 서비스 확인..."
                sh '''
                    # 네트워크 확인
                    if ! docker network ls | grep -q dochi-network; then
                        docker network create dochi-network --driver bridge
                    fi
                    
                    # MySQL 확인 (없으면 시작)
                    if ! docker ps | grep -q dochi-mysql; then
                        echo "⚠️ MySQL이 실행되지 않음. 시작 중..."
                        docker-compose up -d mysql
                        sleep 10
                    fi
                    
                    # Redis 확인 (없으면 시작)
                    if ! docker ps | grep -q dochi-redis; then
                        echo "⚠️ Redis가 실행되지 않음. 시작 중..."
                        docker-compose up -d redis
                        sleep 5
                    fi
                    
                    echo "✅ 필수 서비스 준비 완료"
                '''
            }
        }

        // ===== 7단계: 애플리케이션 배포 (병렬/순차 선택) =====
        stage('Application Deployment') {
            steps {
                script {
                    def appStages = [:]
                    
                    // AI Service
                    appStages['AI Service'] = {
                        echo "🤖 AI Service 배포..."
                        sh '''
                            docker-compose stop ai-service || true
                            docker-compose rm -f ai-service || true
                            if [ "${SKIP_BUILD}" != "true" ]; then
                                docker-compose build ai-service
                            fi
                            docker-compose up -d ai-service
                            
                            for i in {1..30}; do
                                curl -sf http://localhost:8002/health >/dev/null 2>&1 && {
                                    echo "✅ AI Service healthy"
                                    break
                                }
                                sleep 2
                            done
                        '''
                    }
                    
                    // Backend
                    appStages['Backend'] = {
                        echo "⚙️ Backend 배포..."
                        sh '''
                            docker-compose stop backend || true
                            docker-compose rm -f backend || true
                            if [ "${SKIP_BUILD}" != "true" ]; then
                                docker-compose build backend
                            fi
                            docker-compose up -d backend
                            
                            for i in {1..40}; do
                                curl -sf http://localhost:8080/actuator/health >/dev/null 2>&1 && {
                                    echo "✅ Backend healthy"
                                    break
                                }
                                sleep 3
                            done
                        '''
                    }
                    
                    // Frontend
                    appStages['Frontend'] = {
                        echo "🎨 Frontend 배포..."
                        sh '''
                            docker-compose stop frontend || true
                            docker-compose rm -f frontend || true
                            if [ "${SKIP_BUILD}" != "true" ]; then
                                docker-compose build frontend
                            fi
                            docker-compose up -d frontend
                            echo "✅ Frontend deployed"
                        '''
                    }
                    
                    // 병렬 또는 순차 실행
                    if (params.PARALLEL_DEPLOY) {
                        echo "⚡ 병렬 배포 시작..."
                        parallel appStages
                    } else {
                        echo "📝 순차 배포 시작..."
                        // AI Service 먼저
                        appStages['AI Service']()
                        // Backend와 Frontend는 동시에 가능
                        parallel(
                            'Backend': appStages['Backend'],
                            'Frontend': appStages['Frontend']
                        )
                    }
                }
            }
        }

        // ===== 8단계: Nginx 배포 =====
        stage('Deploy Nginx') {
            steps {
                echo "🌐 Nginx 배포..."
                sh '''
                    docker-compose stop nginx || true
                    docker-compose rm -f nginx || true
                    if [ "${SKIP_BUILD}" != "true" ]; then
                        docker-compose build nginx
                    fi
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

        // ===== 9단계: 검증 =====
        stage('Verification') {
            steps {
                echo "🔍 배포 검증..."
                sh '''
                    echo "===== 서비스 상태 ====="
                    docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "dochi-|redis-commander"
                    
                    echo ""
                    echo "===== 엔드포인트 테스트 ====="
                    
                    # Backend
                    if curl -sf http://localhost:8080/actuator/health --max-time 3; then
                        echo "✅ Backend: Healthy"
                    else
                        echo "⚠️ Backend: Not responding"
                    fi
                    
                    # AI Service
                    if curl -sf http://localhost:8002/health --max-time 3; then
                        echo "✅ AI Service: Healthy"
                    else
                        echo "⚠️ AI Service: Not responding"
                    fi
                    
                    # Frontend
                    if curl -sf http://localhost --max-time 3 >/dev/null; then
                        echo "✅ Frontend: Accessible"
                    else
                        echo "⚠️ Frontend: Not responding"
                    fi
                    
                    # 리소스 사용량
                    echo ""
                    echo "===== 리소스 사용량 ====="
                    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -10
                    
                    echo ""
                    echo "🎉 배포 완료!"
                '''
            }
        }

        // ===== 10단계: Docker Hub 푸시 (선택적) =====
        stage('Push to Registry') {
            when {
                expression { params.PUSH_TO_HUB }
            }
            steps {
                echo "📤 Docker Hub 푸시..."
                sh '''
                    # 이미지 태깅
                    docker build -t ${BE_IMAGE} ./SSAFY-DOCHI-BE
                    docker build -t ${FE_IMAGE} ./SSAFY-DOCHI-FE
                    
                    # 병렬 푸시
                    docker push ${BE_IMAGE} &
                    docker push ${FE_IMAGE} &
                    wait
                    
                    echo "✅ 이미지 푸시 완료"
                '''
            }
        }
    }

    post {
        success {
            script {
                def duration = currentBuild.duration / 1000
                echo """
                ====================================
                🎉 배포 성공!
                ====================================
                배포 대상: ${params.DEPLOY_TARGET}
                병렬 배포: ${params.PARALLEL_DEPLOY}
                빌드 건너뜀: ${params.SKIP_BUILD}
                소요 시간: ${duration}초
                빌드 번호: ${BUILD_NUMBER}
                ====================================
                """
            }
        }
        
        failure {
            echo "❌ 배포 실패!"
            sh '''
                echo "===== 실패한 컨테이너 ====="
                docker ps -a --filter "status=exited" --format "table {{.Names}}\t{{.Status}}"
                
                echo ""
                echo "===== 최근 에러 로그 ====="
                for container in $(docker ps -a --filter "status=exited" --format "{{.Names}}" | head -3); do
                    echo "--- $container ---"
                    docker logs --tail 20 "$container" 2>&1 | grep -i error || true
                done
            '''
        }
        
        cleanup {
            echo "🧹 임시 파일 정리..."
            sh 'rm -f *.tmp *.log 2>/dev/null || true'
        }
    }
}