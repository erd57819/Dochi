package com.ssafy.dochi.kafka.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoCallEvent {
    
    // 이벤트 메타데이터
    private String eventId;
    private String eventType; // ROOM_CREATED, USER_JOINED, USER_LEFT, EMOTION_DETECTED, ROOM_CLOSED
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;
    
    // 방 정보
    private String roomId;
    private String sessionId;
    private boolean isPriority; // VIP 룸 여부
    private int maxParticipants;
    
    // 사용자 정보
    private Long userId;
    private String userName;
    private String connectionId;
    
    // 감정 분석 데이터 (EMOTION_DETECTED 이벤트용)
    private EmotionData emotionData;
    
    // 성능 메트릭
    private PerformanceMetrics metrics;
    
    // 추가 데이터
    private Map<String, Object> additionalData;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmotionData {
        private String emotion; // HAPPY, SAD, ANGRY, NEUTRAL, SURPRISED
        private double confidence;
        private double stressLevel; // 0.0 ~ 1.0
        private String audioTone; // CALM, AGGRESSIVE, NERVOUS
        private Map<String, Double> emotionScores; // 각 감정별 점수
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PerformanceMetrics {
        private long processingTimeMs;
        private int participantCount;
        private double cpuUsage;
        private double memoryUsage;
        private int messageQueueSize;
        private double avgLatency;
        private int partitionId;
    }
}