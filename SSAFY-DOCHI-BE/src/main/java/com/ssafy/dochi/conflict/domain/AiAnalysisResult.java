package com.ssafy.dochi.conflict.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PACKAGE)
public class AiAnalysisResult {
    
    private Long id;
    private Long conflictId;
    private Long userId;
    private String emotionAnalysis; // 감정 분석 (JSON 또는 문자열)
    private String conflictAnalysis; // JSON 또는 문자열
    private String myPosition; // 내 입장 분석 (JSON 또는 문자열)
    private String partnerPosition; // 상대방 입장 분석 (JSON 또는 문자열)
    private Integer relationshipHealthScore;
    private String trustScore; // JSON 필드
    private Integer communicationScore;
    private String cooperationScore; // JSON 필드
    private String priorityRecommendation;
    private String recommendedActions; // JSON 필드
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AiAnalysisResult(Long conflictId, Long userId, String emotionAnalysis, String conflictAnalysis, 
                           String myPosition, String partnerPosition,
                           Integer relationshipHealthScore, String trustScore, 
                           Integer communicationScore, String cooperationScore, 
                           String priorityRecommendation, String recommendedActions) {
        this.conflictId = conflictId;
        this.userId = userId;
        this.emotionAnalysis = emotionAnalysis;
        this.conflictAnalysis = conflictAnalysis;
        this.myPosition = myPosition;
        this.partnerPosition = partnerPosition;
        this.relationshipHealthScore = relationshipHealthScore;
        this.trustScore = trustScore;
        this.communicationScore = communicationScore;
        this.cooperationScore = cooperationScore;
        this.priorityRecommendation = priorityRecommendation;
        this.recommendedActions = recommendedActions;
    }
}