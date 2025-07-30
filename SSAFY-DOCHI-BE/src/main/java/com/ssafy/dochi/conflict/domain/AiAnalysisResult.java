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
    private Integer trustScore;
    private String trustAnalysis;
    private Integer communicationScore;
    private Integer cooperationScore;
    private String cooperationSuggestions;
    private String priorityRecommendation;
    private String recommendedActions;
    private String rawAnalysisJson; // 전체 AI 분석 응답을 JSON으로 저장
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AiAnalysisResult(Long conflictId, Long userId, String emotionAnalysis, 
                           String conflictAnalysis, Integer relationshipHealthScore, 
                           Integer trustScore, String trustAnalysis, Integer communicationScore,
                           Integer cooperationScore, String cooperationSuggestions,
                           String priorityRecommendation, String recommendedActions,
                           String rawAnalysisJson) {
        this.conflictId = conflictId;
        this.userId = userId;
        this.emotionAnalysis = emotionAnalysis;
        this.conflictAnalysis = conflictAnalysis;
        this.relationshipHealthScore = relationshipHealthScore;
        this.trustScore = trustScore;
        this.trustAnalysis = trustAnalysis;
        this.communicationScore = communicationScore;
        this.cooperationScore = cooperationScore;
        this.cooperationSuggestions = cooperationSuggestions;
        this.priorityRecommendation = priorityRecommendation;
        this.recommendedActions = recommendedActions;
        this.rawAnalysisJson = rawAnalysisJson;
    }
}