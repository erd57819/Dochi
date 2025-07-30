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
    private String emotionAnalysis;
    private String conflictAnalysis;
    private Integer relationshipHealthScore;
    private String trustScore; // JSON 필드
    private Integer communicationScore;
    private String cooperationScore; // JSON 필드
    private String priorityRecommendation;
    private String recommendedActions; // JSON 필드
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AiAnalysisResult(Long conflictId, Long userId, String emotionAnalysis, 
                           String conflictAnalysis, Integer relationshipHealthScore, 
                           String trustScore, Integer communicationScore,
                           String cooperationScore, String priorityRecommendation, 
                           String recommendedActions) {
        this.conflictId = conflictId;
        this.userId = userId;
        this.emotionAnalysis = emotionAnalysis;
        this.conflictAnalysis = conflictAnalysis;
        this.relationshipHealthScore = relationshipHealthScore;
        this.trustScore = trustScore;
        this.communicationScore = communicationScore;
        this.cooperationScore = cooperationScore;
        this.priorityRecommendation = priorityRecommendation;
        this.recommendedActions = recommendedActions;
    }
}