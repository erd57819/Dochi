package com.ssafy.dochi.kafka.service;

import com.ssafy.dochi.kafka.dto.VideoCallEvent;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
@Profile({"kafka", "dev"}) // kafka 프로파일이나 dev 환경에서만 활성화
@ConditionalOnProperty(name = "kafka.enabled", havingValue = "true", matchIfMissing = false)
public class KafkaMetricsService {
    
    private final MeterRegistry meterRegistry;
    
    // 실시간 메트릭 저장소
    private final ConcurrentHashMap<String, RoomMetrics> roomMetricsMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Integer, PartitionMetrics> partitionMetricsMap = new ConcurrentHashMap<>();
    
    // 전체 시스템 메트릭
    private final AtomicInteger totalActiveRooms = new AtomicInteger(0);
    private final AtomicInteger totalActiveUsers = new AtomicInteger(0);
    private final AtomicLong totalEventsProcessed = new AtomicLong(0);
    private final AtomicLong totalBytesProcessed = new AtomicLong(0);
    
    // 파티션별 처리량
    private final ConcurrentHashMap<Integer, AtomicLong> partitionThroughput = new ConcurrentHashMap<>();
    
    /**
     * 방 생성 메트릭
     */
    public void recordRoomCreated(String roomId, boolean isPriority) {
        RoomMetrics metrics = new RoomMetrics(roomId, isPriority);
        roomMetricsMap.put(roomId, metrics);
        totalActiveRooms.incrementAndGet();
        
        Counter.builder("kafka.room.created")
                .tag("priority", String.valueOf(isPriority))
                .register(meterRegistry)
                .increment();
        
        log.info("방 생성 메트릭 - RoomId: {}, Priority: {}, 전체 활성 방: {}", 
                roomId, isPriority, totalActiveRooms.get());
    }
    
    /**
     * 방 종료 메트릭
     */
    public void recordRoomClosed(String roomId) {
        RoomMetrics metrics = roomMetricsMap.remove(roomId);
        if (metrics != null) {
            long duration = System.currentTimeMillis() - metrics.createdAt;
            totalActiveRooms.decrementAndGet();
            
            Timer.builder("kafka.room.duration")
                    .tag("priority", String.valueOf(metrics.isPriority))
                    .register(meterRegistry)
                    .record(duration, TimeUnit.MILLISECONDS);
            
            log.info("방 종료 메트릭 - RoomId: {}, 지속시간: {}분", 
                    roomId, TimeUnit.MILLISECONDS.toMinutes(duration));
        }
    }
    
    /**
     * 참가자 수 업데이트
     */
    public void updateParticipantCount(String roomId, int count) {
        RoomMetrics metrics = roomMetricsMap.get(roomId);
        if (metrics != null) {
            metrics.participantCount = count;
            metrics.maxParticipants = Math.max(metrics.maxParticipants, count);
            
            // 전체 사용자 수 업데이트
            recalculateTotalUsers();
        }
    }
    
    /**
     * 방 메트릭 업데이트
     */
    public void updateRoomMetrics(String roomId, VideoCallEvent.PerformanceMetrics perfMetrics) {
        RoomMetrics metrics = roomMetricsMap.get(roomId);
        if (metrics != null) {
            metrics.avgLatency = perfMetrics.getAvgLatency();
            metrics.cpuUsage = perfMetrics.getCpuUsage();
            metrics.memoryUsage = perfMetrics.getMemoryUsage();
            metrics.lastUpdated = System.currentTimeMillis();
            
            // 파티션 메트릭 업데이트
            updatePartitionMetrics(perfMetrics.getPartitionId(), perfMetrics);
        }
    }
    
    /**
     * 파티션별 처리량 증가
     */
    public void incrementPartitionProcessed(int partition) {
        partitionThroughput.computeIfAbsent(partition, k -> new AtomicLong(0))
                          .incrementAndGet();
        totalEventsProcessed.incrementAndGet();
    }
    
    /**
     * 배치 처리 시간 기록
     */
    public void recordBatchProcessingTime(long processingTime, int batchSize) {
        Timer.builder("kafka.batch.processing.time")
                .tag("batch_size", String.valueOf(batchSize))
                .register(meterRegistry)
                .record(processingTime, TimeUnit.MILLISECONDS);
        
        // 처리 속도 계산 (events/sec)
        double throughput = (batchSize * 1000.0) / processingTime;
        
        Gauge.builder("kafka.batch.throughput", () -> throughput)
                .tag("metric", "events_per_second")
                .register(meterRegistry);
    }
    
    /**
     * 높은 스트레스 이벤트 기록
     */
    public void recordHighStressEvent(String roomId, Long userId) {
        Counter.builder("kafka.stress.high")
                .tag("room_id", roomId)
                .register(meterRegistry)
                .increment();
        
        RoomMetrics metrics = roomMetricsMap.get(roomId);
        if (metrics != null) {
            metrics.stressEventCount++;
        }
    }
    
    /**
     * 파티션 메트릭 업데이트
     */
    private void updatePartitionMetrics(int partitionId, VideoCallEvent.PerformanceMetrics perfMetrics) {
        PartitionMetrics metrics = partitionMetricsMap.computeIfAbsent(
            partitionId, k -> new PartitionMetrics(partitionId)
        );
        
        metrics.activeRooms++;
        metrics.avgLatency = (metrics.avgLatency + perfMetrics.getAvgLatency()) / 2;
        metrics.messageQueueSize = perfMetrics.getMessageQueueSize();
        metrics.lastUpdated = System.currentTimeMillis();
    }
    
    /**
     * 전체 사용자 수 재계산
     */
    private void recalculateTotalUsers() {
        int total = roomMetricsMap.values().stream()
                .mapToInt(m -> m.participantCount)
                .sum();
        totalActiveUsers.set(total);
    }
    
    /**
     * 시스템 전체 메트릭 조회
     */
    public SystemMetrics getSystemMetrics() {
        return SystemMetrics.builder()
                .totalActiveRooms(totalActiveRooms.get())
                .totalActiveUsers(totalActiveUsers.get())
                .totalEventsProcessed(totalEventsProcessed.get())
                .totalBytesProcessed(totalBytesProcessed.get())
                .partitionMetrics(new ArrayList<>(partitionMetricsMap.values()))
                .topRoomsByParticipants(getTopRoomsByParticipants(5))
                .partitionLoadDistribution(getPartitionLoadDistribution())
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    /**
     * 참가자 수 기준 상위 방 조회
     */
    private List<RoomMetrics> getTopRoomsByParticipants(int limit) {
        return roomMetricsMap.values().stream()
                .sorted((a, b) -> Integer.compare(b.participantCount, a.participantCount))
                .limit(limit)
                .toList();
    }
    
    /**
     * 파티션별 부하 분포
     */
    private Map<Integer, Long> getPartitionLoadDistribution() {
        Map<Integer, Long> distribution = new HashMap<>();
        partitionThroughput.forEach((partition, count) -> 
            distribution.put(partition, count.get())
        );
        return distribution;
    }
    
    /**
     * 주기적 메트릭 리포트 (1분마다)
     */
    @Scheduled(fixedDelay = 60000)
    public void reportMetrics() {
        log.info("=== Kafka 시스템 메트릭 리포트 ===");
        log.info("활성 방: {}, 활성 사용자: {}, 처리된 이벤트: {}", 
                totalActiveRooms.get(), totalActiveUsers.get(), totalEventsProcessed.get());
        
        // 파티션별 처리량
        partitionThroughput.forEach((partition, count) -> {
            log.info("파티션 {} - 처리량: {}", partition, count.get());
        });
        
        // 상위 5개 방
        getTopRoomsByParticipants(5).forEach(room -> {
            log.info("Top Room - ID: {}, 참가자: {}, 지연시간: {}ms", 
                    room.roomId, room.participantCount, room.avgLatency);
        });
    }
    
    // 내부 클래스들
    
    public static class RoomMetrics {
        public String roomId;
        public boolean isPriority;
        public int participantCount;
        public int maxParticipants;
        public double avgLatency;
        public double cpuUsage;
        public double memoryUsage;
        public int stressEventCount;
        public long createdAt;
        public long lastUpdated;
        
        public RoomMetrics(String roomId, boolean isPriority) {
            this.roomId = roomId;
            this.isPriority = isPriority;
            this.createdAt = System.currentTimeMillis();
            this.lastUpdated = System.currentTimeMillis();
        }
    }
    
    public static class PartitionMetrics {
        public int partitionId;
        public int activeRooms;
        public double avgLatency;
        public int messageQueueSize;
        public long lastUpdated;
        
        public PartitionMetrics(int partitionId) {
            this.partitionId = partitionId;
        }
    }
    
    @lombok.Data
    @lombok.Builder
    public static class SystemMetrics {
        private int totalActiveRooms;
        private int totalActiveUsers;
        private long totalEventsProcessed;
        private long totalBytesProcessed;
        private List<PartitionMetrics> partitionMetrics;
        private List<RoomMetrics> topRoomsByParticipants;
        private Map<Integer, Long> partitionLoadDistribution;
        private LocalDateTime timestamp;
    }
}