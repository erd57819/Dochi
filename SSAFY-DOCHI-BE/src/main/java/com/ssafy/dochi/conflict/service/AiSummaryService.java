package com.ssafy.dochi.conflict.service;

import com.ssafy.dochi.conflict.dao.AiAnalysisResultDao;
import com.ssafy.dochi.conflict.domain.AiAnalysisResult;
import com.ssafy.dochi.conflict.domain.UserConflict.ConflictType;
import com.ssafy.dochi.conflict.dto.response.AiAnalysisResDto;
import com.ssafy.dochi.config.GmsAiClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class AiSummaryService {
    
    private final RestTemplate restTemplate;
    private final AiAnalysisResultDao aiAnalysisResultDao;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final GmsAiClient gmsAiClient;
    
    public AiSummaryService(AiAnalysisResultDao aiAnalysisResultDao, GmsAiClient gmsAiClient) {
        this.aiAnalysisResultDao = aiAnalysisResultDao;
        this.gmsAiClient = gmsAiClient;
        this.restTemplate = new RestTemplate();
        // AI 서비스 호출에 대한 타임아웃 설정은 별도로 구성하지 않음 (기본값 사용)
    }
    
    @Value("${ai.service.url:http://localhost:8002}")
    private String aiServiceUrl;
    
    /**
     * 통합 AI 분석 - 모든 분석을 한번에 처리
     */
    public Map<String, Object> generateAdvancedAnalysis(String description, ConflictType conflictType) {
        log.info("통합 AI 분석 요청 시작 - description: {}, type: {}", description, conflictType);
        
        try {
            // AI 서비스에 통합 분석 요청
            log.info("AI 서비스 통합 분석 시도 - URL: {}", aiServiceUrl);
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("original_text", description);
            requestBody.put("conflict_type", getKoreanConflictType(conflictType));
            requestBody.put("model_type", "gpt");
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            log.info("AI 서비스 요청 데이터: {}", requestBody);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                aiServiceUrl + "/api/summary/advanced", entity, Map.class);
            
            log.info("AI 서비스 응답 상태: {}", response.getStatusCode());
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                log.info("AI 서비스 통합 분석 성공 - 응답 키: {}", responseBody.keySet());
                
                // 응답 데이터 검증
                if (responseBody.containsKey("summary") || responseBody.containsKey("emotion_analysis")) {
                    return responseBody;
                } else {
                    log.warn("AI 서비스 응답에 필수 필드가 없음: {}", responseBody.keySet());
                    throw new RuntimeException("AI 통합 분석 응답 형식 오류");
                }
            } else {
                log.warn("AI 서비스 응답 오류 - Status: {}", response.getStatusCode());
                throw new RuntimeException("AI 통합 분석 서비스 응답 오류 - Status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("AI 서비스 통합 분석 실패: {}", e.getMessage());
            throw new RuntimeException("AI 분석 서비스에 연결할 수 없습니다: " + e.getMessage(), e);
        }
    }
    
    /**
     * AI 분석 결과를 MySQL에 저장
     */
    public void saveAdvancedAnalysisResult(Long conflictId, Long userId, Map<String, Object> analysisResult) {
        try {
            log.info("AI 분석 결과 저장 시작 - conflictId: {}, analysisResult keys: {}", 
                    conflictId, analysisResult.keySet());
            
            // 분석 결과에서 필요한 데이터 추출 (객체/문자열 모두 처리)
            String emotionAnalysis = convertToJsonString(analysisResult.get("emotion_analysis"));
            String conflictAnalysis = convertToJsonString(analysisResult.get("conflict_analysis"));
            String myPosition = convertToJsonString(analysisResult.get("my_position"));
            String partnerPosition = convertToJsonString(analysisResult.get("partner_position"));
            
            Integer relationshipHealthScore = getIntegerValue(analysisResult.get("relationship_health_score"));
            Integer communicationScore = getIntegerValue(analysisResult.get("communication_score"));
            String priorityRecommendation = (String) analysisResult.get("priority_recommendation");
            
            // JSON 필드들을 문자열로 변환
            String trustScore = convertToJsonString(analysisResult.get("trust_score"));
            String cooperationScore = convertToJsonString(analysisResult.get("cooperation_score"));
            String recommendedActions = convertToJsonString(analysisResult.get("recommended_actions"));
            
            // AiAnalysisResult 객체 생성 및 저장 (새로운 필드들 포함)
            AiAnalysisResult result = new AiAnalysisResult(
                conflictId, userId, emotionAnalysis, conflictAnalysis, myPosition, partnerPosition,
                relationshipHealthScore, trustScore, communicationScore, cooperationScore, 
                priorityRecommendation, recommendedActions
            );
            
            aiAnalysisResultDao.save(result);
            log.info("AI 분석 결과가 성공적으로 저장되었습니다. conflict_id: {}", conflictId);
            
        } catch (Exception e) {
            log.error("AI 분석 결과 저장 실패 - conflictId: {}, error: {}", conflictId, e.getMessage(), e);
        }
    }
    
    /**
     * 객체를 JSON 문자열로 변환 (null 안전)
     */
    private String convertToJsonString(Object obj) {
        if (obj == null) return null;
        if (obj instanceof String) return (String) obj;
        
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.warn("JSON 변환 실패, 문자열로 반환: {}", obj);
            return obj.toString();
        }
    }
    
    /**
     * Integer 값 추출 (null 안전)
     */
    private Integer getIntegerValue(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Integer) return (Integer) obj;
        if (obj instanceof Number) return ((Number) obj).intValue();
        
        try {
            return Integer.valueOf(obj.toString());
        } catch (NumberFormatException e) {
            log.warn("Integer 변환 실패, null 반환: {}", obj);
            return null;
        }
    }
    
    /**
     * AI 요약 생성 (VideoCall용 - 호환성 유지)
     */
    public String generateSummary(String description, ConflictType conflictType) {
        try {
            Map<String, Object> result = generateAdvancedAnalysis(description, conflictType);
            return (String) result.getOrDefault("summary", "분석을 생성할 수 없습니다.");
        } catch (Exception e) {
            log.error("VideoCall용 AI 요약 생성 실패: {}", e.getMessage());
            return "중재 제안을 생성할 수 없습니다.";
        }
    }
    
    /**
     * 갈등 유형을 한국어로 변환
     */
    private String getKoreanConflictType(ConflictType conflictType) {
        switch (conflictType) {
            case WORK: return "직장/업무";
            case FAMILY: return "가족";
            case FRIEND: return "친구";
            case COUPLE: return "연인/부부";
            case NEIGHBOR: return "이웃";
            case FINANCIAL: return "금전";
            case ONLINE: return "온라인";
            default: return "기타";
        }
    }
}