package com.ssafy.dochi.kafka.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserActivityDto {
    private String userId;
    private String roomId;
    private String activityType; // join, leave, speak, emotion_detected, message_sent
    private String timestamp;
    private String sessionId;
    
    // 추가 활동 데이터
    private String emotionType; // speak/emotion_detected일 때 사용
    private Integer messageLength; // message_sent일 때 사용
    private Integer speakDuration; // speak일 때 사용 (초 단위)
}