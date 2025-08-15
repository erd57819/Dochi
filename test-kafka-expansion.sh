#!/bin/bash

# Kafka 확장성 테스트 스크립트
echo "🚀 참견도치 Kafka 확장성 테스트 시작"
echo "=================================="

# 1. Docker 환경 체크
echo "📋 Docker 환경 확인..."
docker ps | grep -E "kafka|zookeeper|redis" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Docker 컨테이너 실행 중"
else
    echo "❌ Docker 컨테이너가 실행되지 않음. docker-compose up -d 실행 필요"
    exit 1
fi

# 2. Backend 헬스 체크
echo "📋 Backend 서비스 확인..."
curl -s http://localhost:8080/api/kafka/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Kafka Controller 활성화됨"
else
    echo "⚠️  Kafka Controller 비활성화 - KAFKA_ENABLED=true 설정 필요"
fi

# 3. AI 서비스 Kafka 확인
echo "📋 AI 서비스 Kafka 상태 확인..."
docker exec dochi-ai-service python -c "from core.config import settings; print('✅ Kafka 활성화' if settings.use_kafka else '❌ Kafka 비활성화')" 2>/dev/null

# 4. Redis 연결 테스트
echo "📋 Redis 연결 확인..."
docker exec dochi-redis redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Redis 연결 성공"
else
    echo "❌ Redis 연결 실패"
fi

# 5. 간단한 메트릭 전송 테스트
echo "📋 메트릭 전송 테스트..."
curl -X POST http://localhost:8080/api/kafka/room-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "TEST-001",
    "participantCount": 2,
    "callDurationSeconds": 120,
    "conflictLevel": 30,
    "timestamp": "'$(date -Iseconds)'"
  }' -s > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 메트릭 전송 성공"
else
    echo "❌ 메트릭 전송 실패"
fi

echo ""
echo "=================================="
echo "테스트 완료!"
echo ""
echo "🎯 다음 단계:"
echo "1. 실시간 모니터링: docker exec -it dochi-ai-service python monitoring/realTimeMonitor.py"
echo "2. 부하 테스트: docker exec -it dochi-ai-service python simulation/loadTestSimulator.py"
echo "3. 성능 대시보드: docker exec -it dochi-ai-service python simulation/performanceDashboard.py"