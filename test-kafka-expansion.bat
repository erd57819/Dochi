@echo off
echo ======================================
echo Kafka Expansion Test for Windows
echo ======================================

echo [1] Checking Docker containers...
docker ps | findstr "kafka zookeeper redis" >nul 2>&1
if %errorlevel% == 0 (
    echo OK: Docker containers running
) else (
    echo ERROR: Docker containers not running. Run: docker-compose up -d
    exit /b 1
)

echo.
echo [2] Testing Backend Kafka Health...
curl -s http://localhost:8080/api/kafka/health >nul 2>&1
if %errorlevel% == 0 (
    echo OK: Kafka Controller is active
) else (
    echo WARNING: Kafka Controller inactive - Set KAFKA_ENABLED=true
)

echo.
echo [3] Testing Redis connection...
docker exec dochi-redis redis-cli ping >nul 2>&1
if %errorlevel% == 0 (
    echo OK: Redis connected
) else (
    echo ERROR: Redis connection failed
)

echo.
echo [4] Sending test metrics...
curl -X POST http://localhost:8080/api/kafka/room-metrics ^
  -H "Content-Type: application/json" ^
  -d "{\"roomId\":\"TEST-WIN-001\",\"participantCount\":2,\"conflictLevel\":30}" >nul 2>&1

if %errorlevel% == 0 (
    echo OK: Test metrics sent
) else (
    echo ERROR: Failed to send metrics
)

echo.
echo ======================================
echo Test Complete!
echo.
echo Next Steps:
echo 1. Real-time Monitor: docker exec -it dochi-ai-service python monitoring/realTimeMonitor.py
echo 2. Load Test: docker exec -it dochi-ai-service python simulation/loadTestSimulator.py
echo 3. Performance Dashboard: docker exec -it dochi-ai-service python simulation/performanceDashboard.py
echo ======================================
pause