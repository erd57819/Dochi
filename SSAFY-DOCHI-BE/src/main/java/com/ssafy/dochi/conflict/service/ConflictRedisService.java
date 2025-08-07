package com.ssafy.dochi.conflict.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.dochi.conflict.dto.request.ConflictCreateReqDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConflictRedisService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    
    private static final String CONFLICT_TEMP_PREFIX = "temp_conflict:";
    private static final String ANALYSIS_RESULT_PREFIX = "analysis_result:";
    private static final int TEMP_CONFLICT_EXPIRATION_HOURS = 1; // 1시간 TTL
    private static final int ANALYSIS_RESULT_EXPIRATION_HOURS = 24; // 24시간 TTL
    
    /**
     * 갈등 카드를 Redis에 임시 저장
     */
    public String saveTempConflict(Long userId, ConflictCreateReqDto conflictData) {
        try {
            String conflictId = generateTempConflictId(userId);
            String key = CONFLICT_TEMP_PREFIX + conflictId;
            
            // 갈등 데이터를 JSON으로 변환하여 저장
            String conflictJson = objectMapper.writeValueAsString(conflictData);
            redisTemplate.opsForValue().set(key, conflictJson, TEMP_CONFLICT_EXPIRATION_HOURS, TimeUnit.HOURS);
            
            log.info("임시 갈등 카드 저장 완료: {}", conflictId);
            return conflictId;
        } catch (JsonProcessingException e) {
            log.error("갈등 데이터 JSON 변환 실패", e);
            throw new RuntimeException("갈등 데이터 저장에 실패했습니다.");
        }
    }
    
    /**
     * Redis에서 임시 갈등 카드 조회
     */
    public ConflictCreateReqDto getTempConflict(String conflictId) {
        try {
            String key = CONFLICT_TEMP_PREFIX + conflictId;
            String conflictJson = (String) redisTemplate.opsForValue().get(key);
            
            if (conflictJson == null) {
                throw new IllegalArgumentException("임시 갈등 카드를 찾을 수 없습니다. (만료되었거나 존재하지 않음)");
            }
            
            return objectMapper.readValue(conflictJson, ConflictCreateReqDto.class);
        } catch (JsonProcessingException e) {
            log.error("갈등 데이터 JSON 파싱 실패", e);
            throw new RuntimeException("갈등 데이터 조회에 실패했습니다.");
        }
    }
    
    /**
     * Redis에서 임시 갈등 카드 삭제
     */
    public void deleteTempConflict(String conflictId) {
        String key = CONFLICT_TEMP_PREFIX + conflictId;
        redisTemplate.delete(key);
        log.info("임시 갈등 카드 삭제 완료: {}", conflictId);
    }
    
    /**
     * 고급 AI 분석 결과를 Redis에 저장
     */
    public void saveAnalysisResult(String tempConflictId, Map<String, Object> analysisResult) {
        try {
            String key = ANALYSIS_RESULT_PREFIX + tempConflictId;
            
            // 분석 결과를 JSON으로 변환하여 저장
            String analysisJson = objectMapper.writeValueAsString(analysisResult);
            redisTemplate.opsForValue().set(key, analysisJson, ANALYSIS_RESULT_EXPIRATION_HOURS, TimeUnit.HOURS);
            
            log.info("고급 분석 결과 저장 완료: {}", tempConflictId);
        } catch (JsonProcessingException e) {
            log.error("분석 결과 JSON 변환 실패", e);
            throw new RuntimeException("분석 결과 저장에 실패했습니다.");
        }
    }
    
    /**
     * Redis에서 고급 AI 분석 결과 조회
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getAnalysisResult(String tempConflictId) {
        try {
            String key = ANALYSIS_RESULT_PREFIX + tempConflictId;
            String analysisJson = (String) redisTemplate.opsForValue().get(key);
            
            if (analysisJson == null) {
                log.info("저장된 분석 결과가 없습니다: {}", tempConflictId);
                return null;
            }
            
            return objectMapper.readValue(analysisJson, Map.class);
        } catch (JsonProcessingException e) {
            log.error("분석 결과 JSON 파싱 실패", e);
            return null;
        }
    }
    
    /**
     * Redis에서 고급 AI 분석 결과 삭제
     */
    public void deleteAnalysisResult(String tempConflictId) {
        String key = ANALYSIS_RESULT_PREFIX + tempConflictId;
        redisTemplate.delete(key);
        log.info("고급 분석 결과 삭제 완료: {}", tempConflictId);
    }
    
    /**
     * 임시 갈등 카드 ID 생성
     */
    private String generateTempConflictId(Long userId) {
        return userId + "_" + System.currentTimeMillis();
    }
}