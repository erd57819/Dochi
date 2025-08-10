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
            APP_ONLY: 앱만 (Backend, Frontend, AI) 배포
            WITH_CACHE: 앱 + Redis 배포
            WITH_DB: 앱 + MySQL + Redis 배포
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
        // ===== 1단계: Show Current State =====
        stage('현재 설정 확인') {
            steps {
                echo "배포 시작"
                echo "배포 대상: ${params.DEPLOY_TARGET}"
                echo "⚡ 병렬 배포: ${params.PARALLEL_DEPLOY}"
                sh '''
                    echo "현재 실행 중인 서비스:"
                    docker ps --format "table {{.Names}}\t{{.Status}}" | head -15
                '''
            }
        }

        // ===== 2단계: Clean Docker Service (FULL_STACK 선택 시) =====
        stage('docker 서비스 정리') {
            when {
                expression { params.DEPLOY_TARGET == 'FULL_STACK' }
            }
            steps {
                echo "DOcker 서비스 정리..."
                sh '''
                        # 1. 컨테이너 정리
                        docker-compose down --remove-orphans || true

                        # 2. 네트워크 정리
                        docker network rm dochi-network 2>/dev/null || true

                        # 3. 사용하지 않는 이미지 정리
                        docker image prune -f || true

                        # 4. 오래된 컨테이너 정리 (중지된 것만)
                        docker container prune -f || true

                        # 5. 빌드 캐시 정리 (선택적)
                        docker builder prune -f --keep-storage 1GB || true

                        echo "✅ 정리 완료 (데이터 보존됨)"

                        # 6. 볼륨 상태 확인
                        echo "현재 볼륨 상태:"
                        docker volume ls | grep -E "mysql-data|redis-data" || echo "볼륨 없음"
                '''
            }
        }

        // ===== 3단계: Get Source Code from GitLab (병렬처리 가능) =====
        stage('소스코드 가져오기 + 도커 로그인') {
            parallel {
                stage('Git Clone') {
                    steps {
                        echo "GitLab에서 소스 코드 가져오기..."
                        git credentialsId: '8981d002-36d7-41a2-a36d-c3ec2add7a5b',
                            url: 'https://lab.ssafy.com/s13-webmobile1-sub1/S13P11C209.git',
                            branch: 'master'
                    }
                }
                
                stage('Docker Login') {
                    steps {
                        echo "Docker Hub 로그인..."
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

         // ===== 4단계: Google Service Account 준비 (항상 실행) =====
         stage('Google Service Account 준비') {
             steps {
                 withCredentials([
                     file(credentialsId: 'GOOGLE-SERVICE-ACCOUNT', variable: 'JSON_PATH')
                 ]) {
                     sh '''
                         cp "$JSON_PATH" google-service-account.json
                         chmod 644 google-service-account.json
                         
                         # 파일 확인
                         if [ -f google-service-account.json ]; then
                             echo "✅ Google Service Account 파일 생성 완료"
                             echo "파일 크기: $(ls -lh google-service-account.json | awk '{print $5}')"
                         else
                             echo "❌ Google Service Account 파일 생성 실패!"
                             exit 1
                         fi
                     '''
                 }
             }
         }

         // ===== 5단계: Build Preparation (병렬처리 가능) =====
         stage('빌드 준비') {
             when {
                 expression { !params.SKIP_BUILD }
             }
             parallel {

                 stage('Environment Variables') {
                     steps {
                         withCredentials([
                             file(credentialsId: 'ENV_FILE', variable: 'ENV_PATH')
                         ]) {
                             sh '''
                                 if [ -f "$ENV_PATH" ]; then
                                     cp "$ENV_PATH" .env
                                     chmod 644 .env
                                     echo "✅ .env 파일 준비 완료"

                                     # 환경 변수 확인
                                     echo "📋 설정된 환경 변수:"
                                     grep -E "^[A-Z_]+" .env | awk -F= '{print "  - " $1}'
                                 else
                                     echo "❌ .env 파일이 없습니다!"
                                     exit 1
                                 fi
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

        // ===== 5단계: Deploy Infrastructure Services (병렬처리 가능) =====
        stage('인프라 서비스 배포') {
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
                    
                    // MySQL (WITH_DB, FULL_STACK 선택 시)
                    if (params.DEPLOY_TARGET == 'WITH_DB' || params.DEPLOY_TARGET == 'FULL_STACK') {
                        infrastructureStages['MySQL'] = {
                            echo " MySQL 시작..."
                            sh '''
                                docker-compose up -d mysql
                                for i in {1..30}; do
                                    docker exec dochi-mysql mysqladmin ping -h localhost --silent 2>/dev/null && {
                                        echo "✅ MySQL ready"
                                        break
                                    }
                                    sleep 1
                                done
                            '''
                        }
                    }
                    
                    // Redis (WITH_CACHE, WITH_DB, FULL_STACK 선택 시)
                    if (params.DEPLOY_TARGET != 'APP_ONLY') {
                        infrastructureStages['Redis'] = {
                            echo "Redis 시작..."
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
                    
                    // Kafka (FULL_STACK 선택 시)
                    if (params.DEPLOY_TARGET == 'FULL_STACK') {
                        infrastructureStages['Kafka'] = {
                            echo "Kafka 시작..."
                            sh '''
                                docker-compose up -d zookeeper kafka
                                sleep 10
                                for i in {1..20}; do
                                    docker exec dochi-kafka kafka-broker-api-versions.sh \
                                        --bootstrap-server localhost:9092 >/dev/null 2>&1 && {
                                        echo "✅ Kafka ready"
                                        break
                                    }
                                    sleep 1
                                done
                            '''
                        }
                        
                        infrastructureStages['OpenVidu'] = {
                            echo "OpenVidu 시작..."
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

        // ===== 6단계: Check Required Services =====
        stage('필수 서비스 동작 확인') {
            steps {
                echo "필수 서비스 확인..."
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

        // ===== 7단계: Application Deployment (병렬처리 가능) =====
        stage('애플리케이션 배포') {
            steps {
                script {
                    def appStages = [:]
                    
                    // AI Service
                    appStages['AI Service'] = {
                        echo "AI Service 배포..."
                        sh '''
                            # Google Service Account 파일 확인
                            if [ ! -f google-service-account.json ]; then
                                echo "❌ google-service-account.json 파일이 없습니다!"
                                echo "현재 디렉토리 내용:"
                                ls -la | grep -E "(google|json)" || echo "관련 파일 없음"
                                exit 1
                            fi
                            
                            echo "📄 Google Service Account 파일 확인: $(ls -lh google-service-account.json | awk '{print $5}')"
                            
                            # AI Service 재시작
                            docker-compose stop ai-service || true
                            docker-compose rm -f ai-service || true
                            if [ "${SKIP_BUILD}" != "true" ]; then
                                docker-compose build ai-service
                            fi
                            docker-compose up -d ai-service
                            
                            # 헬스체크
                            for i in {1..30}; do
                                curl -sf http://localhost:8002/health >/dev/null 2>&1 && {
                                    echo "✅ AI Service healthy"
                                    
                                    # Volume 마운트 확인
                                    echo "📁 Volume 마운트 상태 확인:"
                                    docker exec dochi-ai-service ls -la /app/google-service-account.json 2>/dev/null || echo "⚠️ 컨테이너 내 파일 확인 실패"
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
                        echo "Frontend 배포..."
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
                    
                    // 병렬처리 가능
                    if (params.PARALLEL_DEPLOY) {
                        echo "병렬 배포 시작..."
                        parallel appStages
                    } else {
                        echo "순차 배포 시작..."
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

        // ===== 8단계: Deploy Nginx =====
        stage('Nginx 배포') {
            steps {
                echo "Nginx 배포..."
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

        // ===== 9단계: Verification =====
        stage('검증 단계') {
            steps {
                echo "배포 검증..."
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
                    echo "# 배포 완료!"
                '''
            }
        }

        // ===== 10단계: Push to Docker Hub (선택적) =====
        stage('Docker Hub 푸시') {
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
                배포 성공-
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
            echo "임시 파일 정리..."
            sh 'rm -f *.tmp *.log 2>/dev/null || true'
        }
    }
}