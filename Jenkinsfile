pipeline {
    agent any

    tools {
        maven 'maven'
        nodejs 'nodejs'
    }

    environment {
        // Docker Hub 설정
        DOCKERHUB_USERNAME = 'crew8264'
        BE_IMAGE = "${DOCKERHUB_USERNAME}/ssafy-dochi-be:latest"
        FE_IMAGE = "${DOCKERHUB_USERNAME}/ssafy-dochi-fe:latest"
        
        // Docker 최적화 설정
        DOCKER_BUILDKIT = '1'
        COMPOSE_DOCKER_CLI_BUILD = '1'
        COMPOSE_PARALLEL_LIMIT = '4'
    }

    options {
        // 타임아웃 설정 (전체 파이프라인)
        timeout(time: 30, unit: 'MINUTES')
        
        // 동시 빌드 방지
        disableConcurrentBuilds()
        
        // 빌드 기록 관리 (최근 10개만 유지)
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '5'))
        
        // ANSI 색상 지원
        ansiColor('xterm')
        
        // 타임스탬프 표시
        timestamps()
        
        // 병렬 실행 실패 시 즉시 중단
        parallelsAlwaysFailFast()
    }

    stages {
        // ================== PHASE 1: 초기화 및 준비 (병렬) ==================
        stage('Phase 1: Initialization') {
            parallel {
                stage('Clean Infrastructure') {
                    steps {
                        script {
                            echo "🧹 인프라 정리 시작..."
                        }
                        sh '''#!/bin/bash
                            set +e  # 에러 무시 모드
                            
                            # 기존 컨테이너 정리
                            docker-compose down --remove-orphans --volumes 2>/dev/null
                            
                            # 네트워크 정리
                            docker network rm dochi-network 2>/dev/null
                            
                            # 오래된 이미지 정리 (디스크 공간 확보)
                            docker image prune -af --filter "until=72h" 2>/dev/null
                            
                            # 볼륨 정리
                            docker volume prune -f 2>/dev/null
                            
                            set -e  # 에러 처리 모드
                            echo "✅ 인프라 정리 완료"
                        '''
                    }
                }
                
                stage('Git Clone') {
                    when {
                        expression { 
                            // Jenkins가 자동으로 clone하지 않은 경우만
                            return !fileExists('.git')
                        }
                    }
                    steps {
                        script {
                            echo "📥 소스 코드 가져오기..."
                        }
                        git credentialsId: '8981d002-36d7-41a2-a36d-c3ec2add7a5b',
                            url: 'https://lab.ssafy.com/s13-webmobile1-sub1/S13P11C209.git',
                            branch: 'master'
                    }
                }
                
                stage('Docker Registry Login') {
                    steps {
                        script {
                            echo "🔐 Docker Hub 로그인..."
                        }
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

        // ================== PHASE 2: 빌드 준비 (병렬) ==================
        stage('Phase 2: Build Preparation') {
            parallel {
                stage('Setup Credentials') {
                    steps {
                        script {
                            echo "🔑 인증 파일 설정..."
                        }
                        withCredentials([
                            file(credentialsId: 'GOOGLE-SERVICE-ACCOUNT', variable: 'JSON_PATH'),
                            file(credentialsId: 'ENV_FILE', variable: 'ENV_PATH')
                        ]) {
                            sh '''#!/bin/bash
                                # Google Service Account 파일 복사
                                cp "$JSON_PATH" google-service-account.json
                                chmod 644 google-service-account.json
                                
                                # .env 파일 복사 (있는 경우)
                                if [ -n "$ENV_PATH" ]; then
                                    cp "$ENV_PATH" .env
                                    chmod 644 .env
                                    echo "✅ 환경 파일 설정 완료"
                                fi
                                
                                echo "✅ 인증 파일 설정 완료"
                            '''
                        }
                    }
                }
                
                stage('Build Backend JAR') {
                    steps {
                        script {
                            echo "🔨 Backend JAR 빌드..."
                        }
                        dir('SSAFY-DOCHI-BE') {
                            sh '''#!/bin/bash
                                # Maven 캐시 활용
                                mvn clean package -DskipTests \
                                    -Dmaven.repo.local=.m2/repository \
                                    -T 1C
                                echo "✅ Backend JAR 빌드 완료"
                            '''
                        }
                    }
                }
                
                stage('Prepare Frontend Dependencies') {
                    steps {
                        script {
                            echo "📦 Frontend 의존성 준비..."
                        }
                        dir('SSAFY-DOCHI-FE') {
                            sh '''#!/bin/bash
                                if [ -f "package.json" ]; then
                                    # npm 캐시 활용
                                    npm ci --cache .npm --prefer-offline 2>/dev/null || npm install
                                    echo "✅ Frontend 의존성 설치 완료"
                                fi
                            '''
                        }
                    }
                }
            }
        }

        // ================== PHASE 3: 인프라 서비스 (병렬) ==================
        stage('Phase 3: Infrastructure Services') {
            steps {
                script {
                    echo "🏗️ 인프라 서비스 시작..."
                }
                sh '''#!/bin/bash
                    # 네트워크 생성 (docker-compose가 관리)
                    docker-compose up -d mysql
                    sleep 3
                    
                    # 네트워크 확인
                    docker network inspect dochi-network --format='✅ Network {{.Name}} ready' || exit 1
                '''
                
                parallel {
                    stage('Database Layer') {
                        steps {
                            sh '''#!/bin/bash
                                echo "🗄️ 데이터베이스 서비스 시작..."
                                
                                # Redis 시작
                                docker-compose up -d redis redis-commander
                                
                                # 병렬 헬스체크
                                (
                                    for i in {1..30}; do
                                        docker exec dochi-mysql mysqladmin ping -h localhost --silent 2>/dev/null && {
                                            echo "✅ MySQL healthy"
                                            break
                                        }
                                        sleep 2
                                    done
                                ) &
                                
                                (
                                    for i in {1..30}; do
                                        docker exec dochi-redis redis-cli ping 2>/dev/null | grep -q PONG && {
                                            echo "✅ Redis healthy"
                                            break
                                        }
                                        sleep 2
                                    done
                                ) &
                                
                                wait
                                echo "✅ 모든 데이터베이스 준비 완료"
                            '''
                        }
                    }
                    
                    stage('Message Queue') {
                        steps {
                            sh '''#!/bin/bash
                                echo "📨 메시징 시스템 시작..."
                                
                                # Zookeeper & Kafka 동시 시작
                                docker-compose up -d zookeeper kafka
                                
                                # Kafka 준비 대기
                                sleep 8
                                
                                for i in {1..30}; do
                                    docker exec dochi-kafka kafka-broker-api-versions.sh \
                                        --bootstrap-server localhost:9092 &>/dev/null && {
                                        echo "✅ Kafka broker ready"
                                        break
                                    }
                                    [ $i -eq 30 ] && { echo "❌ Kafka 시작 실패"; exit 1; }
                                    sleep 2
                                done
                            '''
                        }
                    }
                    
                    stage('Media Server') {
                        steps {
                            sh '''#!/bin/bash
                                echo "📹 OpenVidu 서버 시작..."
                                
                                docker-compose up -d openvidu-server
                                
                                for i in {1..20}; do
                                    curl -sf http://localhost:7880 &>/dev/null && {
                                        echo "✅ OpenVidu ready"
                                        break
                                    }
                                    [ $i -eq 20 ] && echo "⚠️ OpenVidu 시작 지연"
                                    sleep 2
                                done
                            '''
                        }
                    }
                }
            }
        }

        // ================== PHASE 4: 애플리케이션 서비스 ==================
        stage('Phase 4: Application Services') {
            stages {
                // AI Service는 Backend보다 먼저 시작
                stage('Deploy AI Service') {
                    steps {
                        script {
                            echo "🤖 AI Service 배포..."
                        }
                        sh '''#!/bin/bash
                            docker-compose stop ai-service 2>/dev/null || true
                            docker-compose rm -f ai-service 2>/dev/null || true
                            
                            # 빌드 캐시 활용
                            docker-compose build --build-arg BUILDKIT_INLINE_CACHE=1 ai-service
                            docker-compose up -d ai-service
                            
                            # Health check
                            for i in {1..30}; do
                                curl -sf http://localhost:8002/health &>/dev/null && {
                                    echo "✅ AI Service healthy"
                                    break
                                }
                                [ $i -eq 30 ] && { echo "❌ AI Service 헬스체크 실패"; exit 1; }
                                sleep 2
                            done
                        '''
                    }
                }
                
                // Backend와 Frontend 병렬 배포
                stage('Deploy Core Services') {
                    parallel {
                        stage('Backend Service') {
                            steps {
                                script {
                                    echo "⚙️ Backend 배포..."
                                }
                                sh '''#!/bin/bash
                                    docker-compose stop backend 2>/dev/null || true
                                    docker-compose rm -f backend 2>/dev/null || true
                                    
                                    docker-compose build --build-arg BUILDKIT_INLINE_CACHE=1 backend
                                    docker-compose up -d backend
                                    
                                    # Health check (더 긴 대기시간)
                                    for i in {1..40}; do
                                        response=$(curl -sf http://localhost:8080/actuator/health 2>/dev/null)
                                        if [ -n "$response" ]; then
                                            echo "✅ Backend healthy"
                                            break
                                        fi
                                        [ $i -eq 40 ] && { echo "❌ Backend 헬스체크 실패"; exit 1; }
                                        sleep 3
                                    done
                                '''
                            }
                        }
                        
                        stage('Frontend Service') {
                            steps {
                                script {
                                    echo "🎨 Frontend 배포..."
                                }
                                sh '''#!/bin/bash
                                    docker-compose stop frontend 2>/dev/null || true
                                    docker-compose rm -f frontend 2>/dev/null || true
                                    
                                    docker-compose build --build-arg BUILDKIT_INLINE_CACHE=1 frontend
                                    docker-compose up -d frontend
                                    
                                    echo "✅ Frontend deployed"
                                '''
                            }
                        }
                    }
                }
                
                // Nginx는 마지막에 배포
                stage('Deploy Gateway') {
                    steps {
                        script {
                            echo "🌐 Nginx Gateway 배포..."
                        }
                        sh '''#!/bin/bash
                            docker-compose stop nginx 2>/dev/null || true
                            docker-compose rm -f nginx 2>/dev/null || true
                            
                            # 기존 nginx 이미지 정리
                            docker images --format '{{.Repository}}:{{.Tag}}' | \
                                grep -E '^nginx:' | xargs -r docker rmi 2>/dev/null || true
                            
                            docker-compose build nginx
                            docker-compose up -d nginx
                            
                            # Nginx 시작 확인
                            sleep 5
                            if docker ps | grep -q dochi-nginx; then
                                echo "✅ Nginx gateway running"
                            else
                                echo "❌ Nginx 시작 실패"
                                docker logs dochi-nginx --tail 50
                                exit 1
                            fi
                        '''
                    }
                }
            }
        }

        // ================== PHASE 5: 검증 및 배포 (병렬) ==================
        stage('Phase 5: Finalization') {
            parallel {
                stage('Verify Services') {
                    steps {
                        script {
                            echo "🔍 서비스 검증..."
                        }
                        sh '''#!/bin/bash
                            echo "===== 배포 검증 ====="
                            
                            # 컨테이너 상태
                            echo -e "\n🐳 실행 중인 컨테이너:"
                            docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -20
                            
                            # 엔드포인트 테스트
                            echo -e "\n📡 엔드포인트 상태:"
                            
                            endpoints=(
                                "http://localhost:8080/actuator/health|Backend"
                                "http://localhost:8002/health|AI-Service"
                                "http://localhost:6379|Redis"
                                "http://localhost:3308|MySQL"
                                "http://localhost|Frontend"
                            )
                            
                            for endpoint in "${endpoints[@]}"; do
                                IFS='|' read -r url name <<< "$endpoint"
                                if curl -sf "$url" --max-time 2 &>/dev/null; then
                                    echo "✅ $name: OK"
                                else
                                    echo "⚠️ $name: Not responding"
                                fi
                            done
                            
                            # 리소스 사용량
                            echo -e "\n📊 리소스 사용량:"
                            docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -15
                            
                            echo -e "\n✅ 배포 검증 완료!"
                        '''
                    }
                }
                
                stage('Push to Registry') {
                    steps {
                        script {
                            echo "📤 Docker Hub 푸시..."
                        }
                        sh '''#!/bin/bash
                            # 캐시를 활용한 이미지 빌드
                            echo "Building images with cache..."
                            
                            # Backend 이미지
                            docker build \
                                --cache-from ${BE_IMAGE} \
                                --build-arg BUILDKIT_INLINE_CACHE=1 \
                                -t ${BE_IMAGE} \
                                ./SSAFY-DOCHI-BE
                            
                            # Frontend 이미지
                            docker build \
                                --cache-from ${FE_IMAGE} \
                                --build-arg BUILDKIT_INLINE_CACHE=1 \
                                -t ${FE_IMAGE} \
                                ./SSAFY-DOCHI-FE
                            
                            # 병렬 푸시
                            echo "Pushing images in parallel..."
                            docker push ${BE_IMAGE} &
                            docker push ${FE_IMAGE} &
                            
                            # 모든 푸시 완료 대기
                            wait
                            
                            echo "✅ 모든 이미지 Docker Hub 푸시 완료"
                        '''
                    }
                }
                
                stage('Cleanup') {
                    steps {
                        script {
                            echo "🧹 정리 작업..."
                        }
                        sh '''#!/bin/bash
                            # 댄글링 이미지 정리
                            docker image prune -f --filter "dangling=true"
                            
                            # 사용하지 않는 볼륨 정리
                            docker volume prune -f
                            
                            # 빌드 캐시 정리 (1GB 이상인 경우)
                            cache_size=$(docker system df --format json | jq '.BuildCache[].Size' | awk '{s+=$1} END {print s}')
                            if [ "${cache_size:-0}" -gt 1073741824 ]; then
                                docker builder prune -f --keep-storage 500MB
                            fi
                            
                            echo "✅ 정리 완료"
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                def duration = currentBuild.duration / 1000
                echo """
                ========================================
                📋 빌드 요약
                ========================================
                빌드 번호: ${BUILD_NUMBER}
                실행 시간: ${duration}초
                결과: ${currentBuild.currentResult}
                ========================================
                """
            }
        }
        
        success {
            script {
                echo "🎉 배포 성공!"
            }
            sh '''#!/bin/bash
                echo "===== 성공적으로 배포된 서비스 ====="
                docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" | grep -E "dochi-|redis-commander"
                
                echo -e "\n📌 접속 정보:"
                echo "- Frontend: http://localhost"
                echo "- Backend API: http://localhost:8080"
                echo "- AI Service: http://localhost:8002"
                echo "- Redis Commander: http://localhost:8083"
            '''
        }
        
        failure {
            script {
                echo "❌ 배포 실패!"
            }
            sh '''#!/bin/bash
                echo "===== 실패 디버깅 정보 ====="
                
                # 종료된 컨테이너 확인
                echo -e "\n💥 비정상 종료된 컨테이너:"
                docker ps -a --filter "status=exited" --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
                
                # 에러 로그 수집
                echo -e "\n📜 최근 에러 로그:"
                for container in $(docker ps -a --filter "status=exited" --format "{{.Names}}"); do
                    echo "--- $container ---"
                    docker logs --tail 20 "$container" 2>&1 | grep -i error || true
                done
                
                # 디스크 공간 확인
                echo -e "\n💾 디스크 사용량:"
                df -h / | tail -1
                docker system df
            '''
        }
        
        unstable {
            script {
                echo "⚠️ 빌드 불안정!"
            }
        }
        
        cleanup {
            script {
                echo "🔧 최종 정리 작업..."
            }
            sh '''#!/bin/bash
                # 작업 공간 정리 (선택적)
                # rm -rf .npm .m2/repository node_modules 2>/dev/null || true
                
                # Docker 로그아웃
                docker logout 2>/dev/null || true
            '''
        }
    }
}
