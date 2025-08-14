package com.ssafy.dochi.kafka.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.dochi.kafka.dto.RoomMetricsDto;
import com.ssafy.dochi.kafka.dto.UserActivityDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Random random = new Random();

    @Value("${spring.kafka.topics.room-metrics:room-metrics}")
    private String roomMetricsTopic;

    @Value("${spring.kafka.topics.user-activity:user-activity}")
    private String userActivityTopic;

    /**
     * 룸 메트릭 데이터를 Kafka로 전송 (파티션 키 사용)
     */
    public void sendRoomMetrics(RoomMetricsDto roomMetrics) {
        try {
            String message = objectMapper.writeValueAsString(roomMetrics);
            // roomId를 파티션 키로 사용하여 같은 방의 메트릭이 같은 파티션에 저장되도록 함
            String partitionKey = roomMetrics.getRoomId();
            
            kafkaTemplate.send(roomMetricsTopic, partitionKey, message);
            log.info("룸 메트릭 전송 완료 - Topic: {}, PartitionKey: {}, RoomId: {}", 
                    roomMetricsTopic, partitionKey, roomMetrics.getRoomId());
                    
        } catch (Exception e) {
            log.error("룸 메트릭 전송 실패: {}", e.getMessage(), e);
            throw new RuntimeException("룸 메트릭 전송 실패", e);
        }
    }

    /**
     * 사용자 활동 데이터를 Kafka로 전송 (파티션 키 사용)
     */
    public void sendUserActivity(UserActivityDto userActivity) {
        try {
            String message = objectMapper.writeValueAsString(userActivity);
            // roomId를 파티션 키로 사용하여 같은 방의 활동이 같은 파티션에 저장되도록 함
            String partitionKey = userActivity.getRoomId();
            
            kafkaTemplate.send(userActivityTopic, partitionKey, message);
            log.info("사용자 활동 데이터 전송 완료 - Topic: {}, PartitionKey: {}, UserId: {}, Activity: {}", 
                    userActivityTopic, partitionKey, userActivity.getUserId(), userActivity.getActivityType());
                    
        } catch (Exception e) {
            log.error("사용자 활동 데이터 전송 실패: {}", e.getMessage(), e);
            throw new RuntimeException("사용자 활동 데이터 전송 실패", e);
        }
    }

    /**
     * 테스트용 배치 룸 메트릭 전송 (파티셔닝 시연용)
     */
    public void sendBatchRoomMetrics(String roomId, int count) {
        log.info("배치 룸 메트릭 전송 시작 - RoomId: {}, Count: {}", roomId, count);
        
        for (int i = 0; i < count; i++) {
            RoomMetricsDto metrics = RoomMetricsDto.builder()
                    .roomId(roomId)
                    .participantCount(random.nextInt(10) + 1)
                    .callDuration(random.nextInt(3600) + 60)
                    .conflictLevel(random.nextInt(10) + 1)
                    .timestamp(LocalDateTime.now().minusMinutes(random.nextInt(60))
                              .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                    .status(getRandomStatus())
                    .totalMessages(random.nextInt(100))
                    .avgEmotionScore(random.nextDouble() * 10)
                    .build();
            
            sendRoomMetrics(metrics);
            
            // 너무 빠른 전송 방지
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        
        log.info("배치 룸 메트릭 전송 완료 - RoomId: {}, Count: {}", roomId, count);
    }

    /**
     * 테스트용 배치 사용자 활동 전송 (파티셔닝 시연용)
     */
    public void sendBatchUserActivity(String roomId, int count) {
        log.info("배치 사용자 활동 전송 시작 - RoomId: {}, Count: {}", roomId, count);
        
        String[] activityTypes = {"join", "leave", "speak", "emotion_detected", "message_sent"};
        String[] emotionTypes = {"happy", "sad", "angry", "neutral", "surprised"};
        
        for (int i = 0; i < count; i++) {
            String activityType = activityTypes[random.nextInt(activityTypes.length)];
            
            UserActivityDto activity = UserActivityDto.builder()
                    .userId("test_user_" + (random.nextInt(5) + 1))
                    .roomId(roomId)
                    .activityType(activityType)
                    .timestamp(LocalDateTime.now().minusMinutes(random.nextInt(60))
                              .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                    .sessionId("session_" + roomId + "_" + i)
                    .emotionType("speak".equals(activityType) || "emotion_detected".equals(activityType) 
                               ? emotionTypes[random.nextInt(emotionTypes.length)] : null)
                    .messageLength("message_sent".equals(activityType) ? random.nextInt(200) + 10 : null)
                    .speakDuration("speak".equals(activityType) ? random.nextInt(30) + 1 : null)
                    .build();
            
            sendUserActivity(activity);
            
            // 너무 빠른 전송 방지
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        
        log.info("배치 사용자 활동 전송 완료 - RoomId: {}, Count: {}", roomId, count);
    }

    private String getRandomStatus() {
        String[] statuses = {"active", "ended", "paused"};
        return statuses[random.nextInt(statuses.length)];
    }
}