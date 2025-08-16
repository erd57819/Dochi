package com.ssafy.dochi.kafka.consumer;

import com.ssafy.dochi.kafka.dto.VideoCallEvent;
import com.ssafy.dochi.kafka.service.KafkaMetricsService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
@Profile({"kafka", "dev", "prod"}) // kafka, dev, prod 환경에서 활성화
@ConditionalOnProperty(name = "kafka.enabled", havingValue = "true", matchIfMissing = false)
public class VideoCallEventConsumer {
    
    private final MeterRegistry meterRegistry;
    private final KafkaMetricsService metricsService;
    
    // 파티션별 처리 카운터
    private final ConcurrentHashMap<Integer, AtomicInteger> partitionCounters = new ConcurrentHashMap<>();
    
    // 방별 참가자 수 추적
    private final ConcurrentHashMap<String, AtomicInteger> roomParticipants = new ConcurrentHashMap<>();
    
    /**
     * 일반 화상채팅 이벤트 처리 (배치 처리)
     */
    @KafkaListener(
        topics = "video-call-events",
        groupId = "video-call-processor",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumeVideoCallEvents(
            List<ConsumerRecord<String, VideoCallEvent>> records,
            Acknowledgment acknowledgment,
            @Header(KafkaHeaders.RECEIVED_PARTITION) List<Integer> partitions) {
        
        log.info("배치 수신 - 이벤트 수: {}, 파티션: {}", records.size(), partitions.get(0));
        
        long startTime = System.currentTimeMillis();
        int processedCount = 0;
        
        try {
            for (ConsumerRecord<String, VideoCallEvent> record : records) {
                processEvent(record.value(), record.partition());
                processedCount++;
                
                // 파티션별 카운터 업데이트
                partitionCounters.computeIfAbsent(record.partition(), k -> new AtomicInteger())
                                .incrementAndGet();
            }
            
            // 수동 커밋
            acknowledgment.acknowledge();
            
            // 처리 시간 기록
            long processingTime = System.currentTimeMillis() - startTime;
            metricsService.recordBatchProcessingTime(processingTime, processedCount);
            
            log.info("배치 처리 완료 - 처리 수: {}, 소요시간: {}ms", processedCount, processingTime);
            
        } catch (Exception e) {
            log.error("배치 처리 실패", e);
            // 실패 메트릭 기록
            Counter.builder("kafka.batch.failed")
                    .register(meterRegistry)
                    .increment();
        }
    }
    
    /**
     * 우선순위 이벤트 처리 (개별 처리)
     */
    @KafkaListener(
        topics = "priority-video-calls",
        groupId = "priority-processor"
    )
    public void consumePriorityEvents(
            @Payload VideoCallEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {
        
        log.info("우선순위 이벤트 수신 - Type: {}, RoomId: {}, Partition: {}", 
                event.getEventType(), event.getRoomId(), partition);
        
        // 우선순위 이벤트는 즉시 처리
        processPriorityEvent(event);
        
        // 메트릭 기록
        Counter.builder("kafka.priority.processed")
                .tag("event_type", event.getEventType())
                .register(meterRegistry)
                .increment();
    }
    
    /**
     * 메트릭 이벤트 처리
     */
    @KafkaListener(
        topics = "video-call-metrics",
        groupId = "metrics-processor"
    )
    public void consumeMetrics(@Payload VideoCallEvent event) {
        if (event.getMetrics() != null) {
            metricsService.updateRoomMetrics(
                event.getRoomId(),
                event.getMetrics()
            );
        }
    }
    
    /**
     * 일반 이벤트 처리 로직
     */
    private void processEvent(VideoCallEvent event, int partition) {
        switch (event.getEventType()) {
            case "ROOM_CREATED":
                handleRoomCreated(event);
                break;
            case "USER_JOINED":
                handleUserJoined(event);
                break;
            case "USER_LEFT":
                handleUserLeft(event);
                break;
            case "EMOTION_DETECTED":
                handleEmotionDetected(event);
                break;
            case "ROOM_CLOSED":
                handleRoomClosed(event);
                break;
            default:
                log.warn("알 수 없는 이벤트 타입: {}", event.getEventType());
        }
        
        // 파티션별 처리량 메트릭
        metricsService.incrementPartitionProcessed(partition);
    }
    
    /**
     * 우선순위 이벤트 처리 로직
     */
    private void processPriorityEvent(VideoCallEvent event) {
        // VIP 룸은 추가 처리 (알림, 로깅 등)
        log.info("VIP 룸 이벤트 우선 처리 - RoomId: {}", event.getRoomId());
        
        // 실시간 알림 발송 등 우선순위 처리
        processEvent(event, -1); // -1은 VIP 파티션 표시
    }
    
    private void handleRoomCreated(VideoCallEvent event) {
        log.info("방 생성 - RoomId: {}, Priority: {}", event.getRoomId(), event.isPriority());
        roomParticipants.put(event.getRoomId(), new AtomicInteger(0));
        metricsService.recordRoomCreated(event.getRoomId(), event.isPriority());
    }
    
    private void handleUserJoined(VideoCallEvent event) {
        AtomicInteger count = roomParticipants.get(event.getRoomId());
        if (count != null) {
            int participants = count.incrementAndGet();
            log.info("사용자 입장 - RoomId: {}, UserId: {}, 현재 참가자: {}", 
                    event.getRoomId(), event.getUserId(), participants);
            metricsService.updateParticipantCount(event.getRoomId(), participants);
        }
    }
    
    private void handleUserLeft(VideoCallEvent event) {
        AtomicInteger count = roomParticipants.get(event.getRoomId());
        if (count != null) {
            int participants = count.decrementAndGet();
            log.info("사용자 퇴장 - RoomId: {}, UserId: {}, 남은 참가자: {}", 
                    event.getRoomId(), event.getUserId(), participants);
            metricsService.updateParticipantCount(event.getRoomId(), participants);
        }
    }
    
    private void handleEmotionDetected(VideoCallEvent event) {
        if (event.getEmotionData() != null) {
            VideoCallEvent.EmotionData emotion = event.getEmotionData();
            log.debug("감정 감지 - RoomId: {}, UserId: {}, Emotion: {}, Stress: {}", 
                    event.getRoomId(), event.getUserId(), 
                    emotion.getEmotion(), emotion.getStressLevel());
            
            // 스트레스 레벨이 높으면 경고
            if (emotion.getStressLevel() > 0.7) {
                log.warn("높은 스트레스 감지 - RoomId: {}, UserId: {}, Level: {}", 
                        event.getRoomId(), event.getUserId(), emotion.getStressLevel());
                metricsService.recordHighStressEvent(event.getRoomId(), event.getUserId());
            }
        }
    }
    
    private void handleRoomClosed(VideoCallEvent event) {
        log.info("방 종료 - RoomId: {}", event.getRoomId());
        roomParticipants.remove(event.getRoomId());
        metricsService.recordRoomClosed(event.getRoomId());
    }
    
    /**
     * 현재 파티션별 처리 통계
     */
    public ConcurrentHashMap<Integer, AtomicInteger> getPartitionStats() {
        return new ConcurrentHashMap<>(partitionCounters);
    }
}