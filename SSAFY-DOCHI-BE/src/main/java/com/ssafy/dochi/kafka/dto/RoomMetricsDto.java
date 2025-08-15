package com.ssafy.dochi.kafka.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 방별 메트릭 정보 DTO
 * 기존 서비스와 완전 분리된 새로운 Kafka 전용 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomMetricsDto {
    
    /**
     * 방 ID (파티션 키로 사용)
     */
    private String roomId;
    
    /**
     * 현재 참가자 수
     */
    private Integer participantCount;
    
    /**
     * 통화 진행 시간 (초)
     */
    private Long callDurationSeconds;
    
    /**
     * 갈등 레벨 (0-100)
     */
    private Integer conflictLevel;
    
    /**
     * STT 메시지 수 (누적)
     */
    private Integer totalMessages;
    
    /**
     * 감정 분석 점수 평균
     */
    private Double avgEmotionScore;
    
    /**
     * 메트릭 생성 시각
     */
    private String timestamp;
    
    /**
     * 추가 메타데이터 (JSON 형태)
     */
    private String metadata;
    
    /**
     * 방 상태 (ACTIVE, WAITING, ENDED)
     */
    private String roomStatus;
    
    /**
     * 처리 우선순위 (파티션 분산용)
     */
    private Integer priority;
}