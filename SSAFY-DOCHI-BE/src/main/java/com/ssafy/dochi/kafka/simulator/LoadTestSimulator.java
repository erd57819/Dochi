package com.ssafy.dochi.kafka.simulator;

import com.ssafy.dochi.kafka.dto.VideoCallEvent;
import com.ssafy.dochi.kafka.producer.VideoCallEventProducer;
import com.ssafy.dochi.kafka.service.KafkaMetricsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
@Profile({"kafka", "dev"}) // kafka 프로파일이나 dev 환경에서만 활성화
@ConditionalOnProperty(name = "kafka.enabled", havingValue = "true", matchIfMissing = false)
public class LoadTestSimulator {
    
    private final VideoCallEventProducer eventProducer;
    private final KafkaMetricsService metricsService;
    
    private final ExecutorService executorService = Executors.newFixedThreadPool(50);
    private final ScheduledExecutorService scheduledExecutor = Executors.newScheduledThreadPool(10);
    
    // 시뮬레이션 상태
    private volatile boolean isRunning = false;
    private final AtomicInteger activeRoomCount = new AtomicInteger(0);
    private final AtomicLong totalEventsSent = new AtomicLong(0);
    
    // 감정 리스트
    private final List<String> emotions = Arrays.asList("HAPPY", "SAD", "ANGRY", "NEUTRAL", "SURPRISED");
    private final List<String> audioTones = Arrays.asList("CALM", "AGGRESSIVE", "NERVOUS");
    
    /**
     * 대규모 부하 테스트 시작 (1000개 방 동시 생성)
     */
    @Async
    public CompletableFuture<SimulationResult> startMassiveLoadTest(int roomCount, int durationMinutes) {
        log.info("=== 대규모 부하 테스트 시작 - 방 수: {}, 지속시간: {}분 ===", roomCount, durationMinutes);
        
        isRunning = true;
        long startTime = System.currentTimeMillis();
        
        // 결과 수집용
        SimulationResult result = new SimulationResult();
        result.setStartTime(startTime);
        result.setTargetRoomCount(roomCount);
        
        try {
            // 1. 방 생성 단계
            List<SimulatedRoom> rooms = createRooms(roomCount);
            result.setActualRoomCount(rooms.size());
            
            // 2. 사용자 입장 시뮬레이션
            simulateUsersJoining(rooms);
            
            // 3. 실시간 이벤트 발생 (감정, 메트릭 등)
            ScheduledFuture<?> eventGenerator = scheduleEventGeneration(rooms);
            
            // 4. 지정된 시간 동안 실행
            Thread.sleep(durationMinutes * 60 * 1000);
            
            // 5. 종료 처리
            eventGenerator.cancel(false);
            closeAllRooms(rooms);
            
        } catch (InterruptedException e) {
            log.error("시뮬레이션 중단됨", e);
            Thread.currentThread().interrupt();
        } finally {
            isRunning = false;
            long endTime = System.currentTimeMillis();
            result.setEndTime(endTime);
            result.setTotalDuration(endTime - startTime);
            result.setTotalEventsSent(totalEventsSent.get());
            result.setAverageEventsPerSecond(
                (double) totalEventsSent.get() / ((endTime - startTime) / 1000.0)
            );
            
            log.info("=== 부하 테스트 완료 ===");
            log.info("총 이벤트: {}, 평균 처리량: {:.2f} events/sec", 
                    result.getTotalEventsSent(), result.getAverageEventsPerSecond());
        }
        
        return CompletableFuture.completedFuture(result);
    }
    
    /**
     * 점진적 부하 증가 테스트
     */
    @Async
    public void startGradualLoadTest(int maxRooms, int incrementStep, int intervalSeconds) {
        log.info("점진적 부하 테스트 시작 - 최대 방: {}, 증가량: {}, 간격: {}초", 
                maxRooms, incrementStep, intervalSeconds);
        
        isRunning = true;
        List<SimulatedRoom> allRooms = new ArrayList<>();
        
        scheduledExecutor.scheduleAtFixedRate(() -> {
            if (activeRoomCount.get() >= maxRooms || !isRunning) {
                return;
            }
            
            // 단계별로 방 추가
            List<SimulatedRoom> newRooms = createRooms(incrementStep);
            allRooms.addAll(newRooms);
            simulateUsersJoining(newRooms);
            
            log.info("부하 증가 - 현재 활성 방: {}/{}", activeRoomCount.get(), maxRooms);
            
        }, 0, intervalSeconds, TimeUnit.SECONDS);
    }
    
    /**
     * 스파이크 테스트 (갑작스런 부하 증가)
     */
    @Async
    public void startSpikeTest(int normalLoad, int spikeLoad, int spikeDurationSeconds) {
        log.info("스파이크 테스트 시작 - 평상시: {}, 스파이크: {}, 지속: {}초", 
                normalLoad, spikeLoad, spikeDurationSeconds);
        
        // 평상시 부하
        List<SimulatedRoom> normalRooms = createRooms(normalLoad);
        simulateUsersJoining(normalRooms);
        
        // 스파이크 발생
        scheduledExecutor.schedule(() -> {
            log.warn("!!! 스파이크 발생 - {} → {} !!!", normalLoad, spikeLoad);
            List<SimulatedRoom> spikeRooms = createRooms(spikeLoad - normalLoad);
            simulateUsersJoining(spikeRooms);
            
            // 스파이크 종료
            scheduledExecutor.schedule(() -> {
                log.info("스파이크 종료 - 방 정리 시작");
                closeAllRooms(spikeRooms);
            }, spikeDurationSeconds, TimeUnit.SECONDS);
            
        }, 10, TimeUnit.SECONDS);
    }
    
    /**
     * 방 생성
     */
    private List<SimulatedRoom> createRooms(int count) {
        List<SimulatedRoom> rooms = new ArrayList<>();
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        
        for (int i = 0; i < count; i++) {
            String roomId = "ROOM_" + UUID.randomUUID().toString().substring(0, 8);
            String sessionId = "SESSION_" + System.nanoTime();
            boolean isPriority = (i % 10 == 0); // 10%는 VIP 룸
            
            SimulatedRoom room = new SimulatedRoom(roomId, sessionId, isPriority);
            rooms.add(room);
            
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                eventProducer.publishRoomCreated(roomId, sessionId, isPriority);
                activeRoomCount.incrementAndGet();
                totalEventsSent.incrementAndGet();
            }, executorService);
            
            futures.add(future);
        }
        
        // 모든 방 생성 완료 대기
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        
        log.info("{} 개 방 생성 완료", rooms.size());
        return rooms;
    }
    
    /**
     * 사용자 입장 시뮬레이션
     */
    private void simulateUsersJoining(List<SimulatedRoom> rooms) {
        Random random = new Random();
        
        rooms.parallelStream().forEach(room -> {
            int userCount = random.nextInt(8) + 2; // 2~10명
            
            for (int i = 0; i < userCount; i++) {
                Long userId = (long) (random.nextInt(10000) + 1);
                String userName = "User_" + userId;
                
                eventProducer.publishUserJoined(room.roomId, userId, userName);
                room.participants.add(userId);
                totalEventsSent.incrementAndGet();
                
                // 입장 간격
                try {
                    Thread.sleep(random.nextInt(100));
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        });
    }
    
    /**
     * 주기적 이벤트 발생
     */
    private ScheduledFuture<?> scheduleEventGeneration(List<SimulatedRoom> rooms) {
        Random random = new Random();
        
        return scheduledExecutor.scheduleAtFixedRate(() -> {
            rooms.parallelStream().forEach(room -> {
                if (room.participants.isEmpty()) return;
                
                // 랜덤 사용자 선택
                Long userId = room.participants.get(
                    random.nextInt(room.participants.size())
                );
                
                // 감정 이벤트 생성
                VideoCallEvent.EmotionData emotionData = VideoCallEvent.EmotionData.builder()
                    .emotion(emotions.get(random.nextInt(emotions.size())))
                    .confidence(0.5 + random.nextDouble() * 0.5)
                    .stressLevel(random.nextDouble())
                    .audioTone(audioTones.get(random.nextInt(audioTones.size())))
                    .build();
                
                eventProducer.publishEmotionDetected(room.roomId, userId, emotionData);
                totalEventsSent.incrementAndGet();
                
                // 메트릭 이벤트
                if (random.nextInt(10) == 0) { // 10% 확률
                    VideoCallEvent.PerformanceMetrics metrics = VideoCallEvent.PerformanceMetrics.builder()
                        .processingTimeMs(random.nextInt(100) + 10)
                        .participantCount(room.participants.size())
                        .cpuUsage(random.nextDouble() * 100)
                        .memoryUsage(random.nextDouble() * 100)
                        .avgLatency(random.nextDouble() * 50)
                        .partitionId(random.nextInt(10))
                        .build();
                    
                    eventProducer.publishMetrics(metrics, room.roomId);
                    totalEventsSent.incrementAndGet();
                }
            });
        }, 0, 1, TimeUnit.SECONDS); // 1초마다 실행
    }
    
    /**
     * 모든 방 종료
     */
    private void closeAllRooms(List<SimulatedRoom> rooms) {
        rooms.parallelStream().forEach(room -> {
            VideoCallEvent closeEvent = VideoCallEvent.builder()
                .eventType("ROOM_CLOSED")
                .roomId(room.roomId)
                .sessionId(room.sessionId)
                .build();
            
            eventProducer.publishVideoCallEvent(closeEvent);
            activeRoomCount.decrementAndGet();
            totalEventsSent.incrementAndGet();
        });
        
        log.info("{} 개 방 종료 완료", rooms.size());
    }
    
    /**
     * 현재 시뮬레이션 상태 조회
     */
    public SimulationStatus getCurrentStatus() {
        return SimulationStatus.builder()
            .isRunning(isRunning)
            .activeRoomCount(activeRoomCount.get())
            .totalEventsSent(totalEventsSent.get())
            .systemMetrics(metricsService.getSystemMetrics())
            .build();
    }
    
    /**
     * 시뮬레이션 중지
     */
    public void stopSimulation() {
        log.info("시뮬레이션 중지 요청");
        isRunning = false;
        executorService.shutdown();
        scheduledExecutor.shutdown();
    }
    
    // 내부 클래스들
    
    private static class SimulatedRoom {
        String roomId;
        String sessionId;
        boolean isPriority;
        List<Long> participants = new ArrayList<>();
        
        SimulatedRoom(String roomId, String sessionId, boolean isPriority) {
            this.roomId = roomId;
            this.sessionId = sessionId;
            this.isPriority = isPriority;
        }
    }
    
    @lombok.Data
    public static class SimulationResult {
        private long startTime;
        private long endTime;
        private long totalDuration;
        private int targetRoomCount;
        private int actualRoomCount;
        private long totalEventsSent;
        private double averageEventsPerSecond;
        private Map<Integer, Long> partitionDistribution;
    }
    
    @lombok.Data
    @lombok.Builder
    public static class SimulationStatus {
        private boolean isRunning;
        private int activeRoomCount;
        private long totalEventsSent;
        private KafkaMetricsService.SystemMetrics systemMetrics;
    }
}