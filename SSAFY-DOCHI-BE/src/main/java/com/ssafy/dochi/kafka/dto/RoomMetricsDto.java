package com.ssafy.dochi.kafka.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomMetricsDto {
    private String roomId;
    private Integer participantCount;
    private Integer callDuration; // 초 단위
    private Integer conflictLevel;
    private String timestamp;
    private String status; // active, ended, paused
    
    // 추가 메트릭
    private Integer totalMessages;
    private Double avgEmotionScore;
}