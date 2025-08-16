package com.ssafy.dochi.kafka.producer;

import com.ssafy.dochi.kafka.dto.VideoCallEvent;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
@Profile({"kafka", "dev", "prod"}) // kafka, dev, prod 환경에서 활성화
@ConditionalOnProperty(name = "kafka.enabled", havingValue = "true", matchIfMissing = false)
public class VideoCallEventProducer {
    
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final MeterRegistry meterRegistry;
    
    private static final String TOPIC_NORMAL = "video-call-events";
    private static final String TOPIC_PRIORITY = "priority-video-calls";
    private static final String TOPIC_METRICS = "video-call-metrics";
    
    /**
     * 화상채팅 이벤트 발행
     */
    public void publishVideoCallEvent(VideoCallEvent event) {
        // 메트릭 타이머 시작
        Timer.Sample sample = Timer.start(meterRegistry);
        
        try {
            // 이벤트 ID 자동 생성
            if (event.getEventId() == null) {
                event.setEventId(UUID.randomUUID().toString());
            }
            event.setTimestamp(LocalDateTime.now());
            
            // 토픽 선택 (우선순위 기반)
            String topic = event.isPriority() ? TOPIC_PRIORITY : TOPIC_NORMAL;
            
            // 파티션 키 생성 (Sticky Session 보장)
            String partitionKey = generatePartitionKey(event);
            
            // 비동기 전송
            CompletableFuture<SendResult<String, Object>> future = 
                kafkaTemplate.send(topic, partitionKey, event);
            
            // 콜백 처리
            future.whenComplete((result, ex) -> {
                if (ex == null) {
                    log.info("이벤트 발행 성공 - Topic: {}, Partition: {}, Offset: {}, RoomId: {}", 
                            topic,
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset(),
                            event.getRoomId());
                    
                    // 성공 카운터 증가
                    Counter.builder("kafka.event.published")
                            .tag("topic", topic)
                            .tag("event_type", event.getEventType())
                            .register(meterRegistry)
                            .increment();
                } else {
                    log.error("이벤트 발행 실패 - RoomId: {}, Error: {}", 
                            event.getRoomId(), ex.getMessage());
                    
                    // 실패 카운터 증가
                    Counter.builder("kafka.event.failed")
                            .tag("topic", topic)
                            .register(meterRegistry)
                            .increment();
                }
            });
            
        } finally {
            // 타이머 종료 및 기록
            sample.stop(Timer.builder("kafka.event.publish.duration")
                    .tag("event_type", event.getEventType())
                    .register(meterRegistry));
        }
    }
    
    /**
     * 성능 메트릭 전송
     */
    public void publishMetrics(VideoCallEvent.PerformanceMetrics metrics, String roomId) {
        VideoCallEvent metricsEvent = VideoCallEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType("METRICS")
                .roomId(roomId)
                .timestamp(LocalDateTime.now())
                .metrics(metrics)
                .build();
        
        kafkaTemplate.send(TOPIC_METRICS, roomId, metricsEvent);
        
        log.debug("메트릭 발행 - RoomId: {}, Latency: {}ms, Participants: {}", 
                roomId, metrics.getAvgLatency(), metrics.getParticipantCount());
    }
    
    /**
     * 방 생성 이벤트
     */
    public void publishRoomCreated(String roomId, String sessionId, boolean isPriority) {
        VideoCallEvent event = VideoCallEvent.builder()
                .eventType("ROOM_CREATED")
                .roomId(roomId)
                .sessionId(sessionId)
                .isPriority(isPriority)
                .build();
        
        publishVideoCallEvent(event);
    }
    
    /**
     * 사용자 입장 이벤트
     */
    public void publishUserJoined(String roomId, Long userId, String userName) {
        VideoCallEvent event = VideoCallEvent.builder()
                .eventType("USER_JOINED")
                .roomId(roomId)
                .userId(userId)
                .userName(userName)
                .build();
        
        publishVideoCallEvent(event);
    }
    
    /**
     * 감정 감지 이벤트
     */
    public void publishEmotionDetected(String roomId, Long userId, 
                                      VideoCallEvent.EmotionData emotionData) {
        VideoCallEvent event = VideoCallEvent.builder()
                .eventType("EMOTION_DETECTED")
                .roomId(roomId)
                .userId(userId)
                .emotionData(emotionData)
                .build();
        
        publishVideoCallEvent(event);
    }
    
    /**
     * 파티션 키 생성 전략
     */
    private String generatePartitionKey(VideoCallEvent event) {
        // VIP 룸은 "VIP_" 접두사 추가
        String prefix = event.isPriority() ? "VIP_" : "";
        
        // 방ID + 세션ID 조합으로 Sticky Session 보장
        return prefix + event.getRoomId() + "_" + event.getSessionId();
    }
}