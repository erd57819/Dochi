package com.ssafy.dochi.kafka.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * 사용자 활동 정보 DTO
 * 실시간 사용자 행동 분석용 데이터
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserActivityDto {
    
    /**
     * 방 ID (파티션 키)
     */
    private String roomId;
    
    /**
     * 사용자 ID
     */
    private String userId;
    
    /**
     * 활동 유형 (SPEAK, LISTEN, MUTE, UNMUTE, LEAVE, JOIN)
     */
    private String activityType;
    
    /**
     * 발화 길이 (초) - SPEAK일 때만
     */
    private Double speakDuration;
    
    /**
     * 감정 상태 (HAPPY, SAD, ANGRY, NEUTRAL, CONFUSED)
     */
    private String emotionState;
    
    /**
     * 음성 볼륨 레벨 (0-100)
     */
    private Integer volumeLevel;
    
    /**
     * 활동 발생 시각
     */
    private String timestamp;
    
    /**
     * 세션 ID (추적용)
     */
    private String sessionId;
    
    /**
     * 디바이스 정보
     */
    private String deviceInfo;
    
    /**
     * 추가 컨텍스트 데이터
     */
    private String contextData;
}