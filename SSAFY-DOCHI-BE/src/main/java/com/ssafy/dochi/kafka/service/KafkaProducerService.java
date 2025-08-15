package com.ssafy.dochi.kafka.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.dochi.kafka.dto.RoomMetricsDto;
import com.ssafy.dochi.kafka.dto.UserActivityDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;
import org.springframework.util.concurrent.ListenableFuture;
import org.springframework.util.concurrent.ListenableFutureCallback;

/**
 * Kafka Producer 서비스
 * 기존 서비스와 완전 분리된 새로운 메트릭 전송 전용 서비스
 * KAFKA_ENABLED=false일 때는 비활성화됨
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "kafka.enabled", havingValue = "true", matchIfMissing = false)
public class KafkaProducerService {

    private static final String ROOM_METRICS_TOPIC = "room-metrics";
    private static final String USER_ACTIVITY_TOPIC = "user-activity";
    private static final String SYSTEM_HEALTH_TOPIC = "system-health";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public KafkaProducerService(KafkaTemplate<String, String> kafkaTemplate, 
                               ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        log.info("[Kafka Producer] 서비스 초기화 완료 - 기존 서비스와 분리됨");
    }

    /**
     * 방 메트릭 데이터 전송
     * 파티션 키로 roomId 사용하여 같은 방은 항상 같은 파티션으로
     */
    public void sendRoomMetrics(RoomMetricsDto dto) {
        try {
            String message = objectMapper.writeValueAsString(dto);
            String partitionKey = dto.getRoomId();
            
            // 파티션 키 기반 전송
            ListenableFuture<SendResult<String, String>> future = 
                kafkaTemplate.send(ROOM_METRICS_TOPIC, partitionKey, message);
                
            // 비동기 콜백 설정
            future.addCallback(new ListenableFutureCallback<SendResult<String, String>>() {
                @Override
                public void onSuccess(SendResult<String, String> result) {
                    int partition = result.getRecordMetadata().partition();
                    long offset = result.getRecordMetadata().offset();
                    log.info("[방 메트릭 전송 성공] {}번 방 → P{} offset:{}", 
                        dto.getRoomId(), partition, offset);
                }
                
                @Override
                public void onFailure(Throwable ex) {
                    log.error("[방 메트릭 전송 실패] {}번 방: {}", dto.getRoomId(), ex.getMessage());
                }
            });
            
        } catch (JsonProcessingException e) {
            log.error("[방 메트릭 직렬화 실패] {}: {}", dto.getRoomId(), e.getMessage());
        }
    }

    /**
     * 사용자 활동 데이터 전송
     */
    public void sendUserActivity(UserActivityDto dto) {
        try {
            String message = objectMapper.writeValueAsString(dto);
            String partitionKey = dto.getRoomId(); // 같은 방의 활동은 같은 파티션으로
            
            ListenableFuture<SendResult<String, String>> future = 
                kafkaTemplate.send(USER_ACTIVITY_TOPIC, partitionKey, message);
                
            future.addCallback(new ListenableFutureCallback<SendResult<String, String>>() {
                @Override
                public void onSuccess(SendResult<String, String> result) {
                    log.debug("[사용자 활동 전송] {}({}) in {} → P{}", 
                        dto.getActivityType(), dto.getUserId(), dto.getRoomId(),
                        result.getRecordMetadata().partition());
                }
                
                @Override
                public void onFailure(Throwable ex) {
                    log.warn("[사용자 활동 전송 실패] {}: {}", dto.getUserId(), ex.getMessage());
                }
            });
            
        } catch (JsonProcessingException e) {
            log.error("[사용자 활동 직렬화 실패] {}: {}", dto.getUserId(), e.getMessage());
        }
    }

    /**
     * 시스템 헬스 체크 데이터 전송
     */
    public void sendSystemHealth(String healthData) {
        try {
            kafkaTemplate.send(SYSTEM_HEALTH_TOPIC, "system-health", healthData);
            log.debug("[시스템 헬스 전송] 크기: {}bytes", healthData.length());
        } catch (Exception e) {
            log.error("[시스템 헬스 전송 실패]: {}", e.getMessage());
        }
    }

    /**
     * 배치 메트릭 전송 (시뮬레이션용)
     * 실제 서비스 영향 없이 대량 데이터 전송 테스트
     */
    public void sendBatchMetrics(String roomPrefix, int batchSize) {
        log.info("[배치 전송 시작] {}개 메트릭 전송 시작 (접두사: {})", batchSize, roomPrefix);
        
        for (int i = 0; i < batchSize; i++) {
            RoomMetricsDto mockDto = RoomMetricsDto.builder()
                .roomId(roomPrefix + "-" + String.format("%04d", i))
                .participantCount((int) (Math.random() * 10) + 1)
                .callDurationSeconds((long) (Math.random() * 3600))
                .conflictLevel((int) (Math.random() * 100))
                .totalMessages((int) (Math.random() * 200))
                .avgEmotionScore(Math.random())
                .timestamp(java.time.LocalDateTime.now().toString())
                .roomStatus("SIMULATION")
                .priority(i % 3) // 0,1,2로 순환하여 파티션 분산
                .metadata("{\"simulation\":true,\"batch\":" + i + "}")
                .build();
                
            sendRoomMetrics(mockDto);
            
            // CPU 부하 방지
            if (i % 100 == 0) {
                try {
                    Thread.sleep(10);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        
        log.info("[배치 전송 완료] {}개 메트릭 전송 완료", batchSize);
    }
}