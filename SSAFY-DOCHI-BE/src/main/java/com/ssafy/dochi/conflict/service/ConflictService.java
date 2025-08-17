package com.ssafy.dochi.conflict.service;

import com.ssafy.dochi.conflict.dao.ConflictDao;
import com.ssafy.dochi.conflict.dao.AiAnalysisResultDao;
import com.ssafy.dochi.conflict.domain.UserConflict;
import com.ssafy.dochi.conflict.domain.AiAnalysisResult;
import com.ssafy.dochi.conflict.dto.request.ConflictCreateReqDto;
import com.ssafy.dochi.conflict.dto.request.ConflictSummaryReqDto;
import com.ssafy.dochi.conflict.dto.response.AiAnalysisResDto;
import com.ssafy.dochi.conflict.dto.response.ConflictResDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ConflictService {
    
    private final ConflictDao conflictDao;
    private final AiAnalysisResultDao aiAnalysisResultDao;
    private final AiSummaryService aiSummaryService;
    private final ConflictRedisService conflictRedisService;
    
    /**
     * 1단계: 갈등 카드를 Redis에 임시 저장
     */
    public String saveTempConflict(Long userId, ConflictCreateReqDto reqDto) {
        return conflictRedisService.saveTempConflict(userId, reqDto);
    }
    
    
    /**
     * 2단계: AI 분석 (감정, 관계, 소통 등) - Redis에 결과 저장
     */
    public Map<String, Object> analyzeConflictAdvanced(String tempConflictId) {
        // Redis에서 기존 분석 결과 조회 (캐싱)
        Map<String, Object> cachedResult = conflictRedisService.getAnalysisResult(tempConflictId);
        if (cachedResult != null) {
            log.info("Redis에서 캐시된 분석 결과 반환: {}", tempConflictId);
            return cachedResult;
        }
        
        // 캐시된 결과가 없으면 새로 분석
        ConflictCreateReqDto conflictData = conflictRedisService.getTempConflict(tempConflictId);
        
        // Redis에 데이터가 없는 경우 처리
        if (conflictData == null) {
            log.error("Redis에서 tempConflictId {}에 해당하는 데이터를 찾을 수 없습니다.", tempConflictId);
            throw new IllegalArgumentException("임시 저장된 갈등 데이터를 찾을 수 없습니다. ID: " + tempConflictId);
        }
        
        Map<String, Object> analysisResult = aiSummaryService.generateAdvancedAnalysis(
            conflictData.getDescription(), conflictData.getConflictType());
        
        // 분석 결과를 Redis에 저장
        conflictRedisService.saveAnalysisResult(tempConflictId, analysisResult);
        
        return analysisResult;
    }
    
    /**
     * 3단계: AI 분석 후 갈등 저장 및 분석 결과 MySQL 저장
     */
    public ConflictResDto analyzeAndSaveConflictAdvanced(Long userId, String tempConflictId) {
        // Redis에서 갈등 데이터 조회
        ConflictCreateReqDto conflictData = conflictRedisService.getTempConflict(tempConflictId);
        
        // Redis에 데이터가 없는 경우 처리
        if (conflictData == null) {
            log.error("Redis에서 tempConflictId {}에 해당하는 데이터를 찾을 수 없습니다.", tempConflictId);
            throw new IllegalArgumentException("임시 저장된 갈등 데이터를 찾을 수 없습니다. ID: " + tempConflictId);
        }
        
        // Redis에서 기존 분석 결과 조회 (있으면 재사용)
        Map<String, Object> analysisResult = conflictRedisService.getAnalysisResult(tempConflictId);
        
        log.info("Redis 분석 결과 조회 결과 - tempConflictId: {}, result: {}", tempConflictId, 
                analysisResult != null ? "존재" : "없음");
        
        // 분석 결과가 없을 때만 새로 분석 수행
        if (analysisResult == null) {
            log.info("Redis에 저장된 분석 결과가 없어 새로 분석을 수행합니다: {}", tempConflictId);
            analysisResult = aiSummaryService.generateAdvancedAnalysis(
                conflictData.getDescription(), conflictData.getConflictType());
        } else {
            log.info("Redis에 저장된 분석 결과를 재사용합니다: {}", tempConflictId);
            log.info("Redis 분석 결과 키: {}", analysisResult.keySet());
        }
        
        // 분석 결과에서 summary와 solutions 추출
        // Redis에는 summary/solutions가 아닌 conflict_analysis가 저장되므로 이를 활용
        String conflictAnalysis = convertObjectToString(analysisResult.get("conflict_analysis"));
        String recommendedActions = convertObjectToString(analysisResult.get("recommended_actions"));
        
        // summary는 conflict_analysis에서 추출하거나 기본값 사용
        String summary = conflictAnalysis != null ? conflictAnalysis : "AI가 갈등 상황을 분석했습니다.";
        
        // solutions는 recommended_actions에서 추출하거나 기본값 사용  
        String solutions;
        if (recommendedActions != null) {
            // JSON 문자열인 경우 파싱해서 readable한 형태로 변환
            try {
                solutions = extractSolutionsFromRecommendedActions(recommendedActions);
            } catch (Exception e) {
                solutions = recommendedActions; // JSON 파싱 실패시 원본 사용
            }
        } else {
            solutions = "AI가 추천하는 해결방안을 제공합니다.";
        }
        
        log.info("추출된 summary 길이: {}, solutions 길이: {}", 
                summary != null ? summary.length() : 0, 
                solutions != null ? solutions.length() : 0);
        
        // UserConflict 객체 생성 (기본 분석 결과 포함)
        UserConflict conflict = new UserConflict(
            userId,
            conflictData.getTitle(),
            conflictData.getDescription(),
            conflictData.getConflictType(),
            conflictData.getConflictWhen(),
            conflictData.getConflictFrequency(),
            conflictData.getParticipants(),
            conflictData.getDesiredOutcome(),
            conflictData.getPriority(),
            conflictData.getTalkWillingness(),
            conflictData.getInitialEmotion(),
            conflictData.getIntensity(),
            summary + "\n\n[해결방안]\n" + solutions
        );
        
        // 갈등 데이터를 MySQL에 저장
        conflictDao.save(conflict);
        
        // 고급 AI 분석 결과를 MySQL에 저장
        aiSummaryService.saveAdvancedAnalysisResult(conflict.getId(), userId, analysisResult);
        
        // Redis에서 임시 데이터 삭제
        conflictRedisService.deleteTempConflict(tempConflictId);
        // 분석 결과도 삭제
        conflictRedisService.deleteAnalysisResult(tempConflictId);
        
        return ConflictResDto.from(conflict);
    }
    
    
    /**
     * 갈등 생성 및 AI 분석을 한 번에 처리
     */
    public ConflictResDto createConflict(Long userId, ConflictCreateReqDto reqDto) {
        // AI 분석 수행
        Map<String, Object> analysisResult = aiSummaryService.generateAdvancedAnalysis(
            reqDto.getDescription(), reqDto.getConflictType());
        
        // 분석 결과에서 summary와 solutions 추출
        String conflictAnalysis = convertObjectToString(analysisResult.get("conflict_analysis"));
        String recommendedActions = convertObjectToString(analysisResult.get("recommended_actions"));
        
        // summary는 conflict_analysis에서 추출하거나 기본값 사용
        String summary = conflictAnalysis != null ? conflictAnalysis : "AI가 갈등 상황을 분석했습니다.";
        
        // solutions는 recommended_actions에서 추출하거나 기본값 사용  
        String solutions;
        if (recommendedActions != null) {
            try {
                solutions = extractSolutionsFromRecommendedActions(recommendedActions);
            } catch (Exception e) {
                solutions = recommendedActions;
            }
        } else {
            solutions = "AI가 추천하는 해결방안을 제공합니다.";
        }
        
        // UserConflict 객체 생성 (AI 분석 결과 포함)
        UserConflict conflict = new UserConflict(
            userId,
            reqDto.getTitle(),
            reqDto.getDescription(),
            reqDto.getConflictType(),
            reqDto.getConflictWhen(),
            reqDto.getConflictFrequency(),
            reqDto.getParticipants(),
            reqDto.getDesiredOutcome(),
            reqDto.getPriority(),
            reqDto.getTalkWillingness(),
            reqDto.getInitialEmotion(),
            reqDto.getIntensity(),
            summary + "\n\n[해결방안]\n" + solutions
        );
        
        // 갈등 데이터를 MySQL에 저장
        conflictDao.save(conflict);
        
        // 고급 AI 분석 결과를 MySQL에 저장
        aiSummaryService.saveAdvancedAnalysisResult(conflict.getId(), userId, analysisResult);
        
        return ConflictResDto.from(conflict);
    }
    
    
    // 갈등 조회
    @Transactional(readOnly = true)
    public ConflictResDto getConflict(Long conflictId, Long userId) {
        UserConflict conflict = conflictDao.findById(conflictId)
            .orElseThrow(() -> new IllegalArgumentException("갈등을 찾을 수 없습니다."));
        
        if (!conflict.getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }
        
        return ConflictResDto.from(conflict);
    }
    
    // 사용자별 갈등 목록 조회 (고급 AI 분석 결과 포함)
    @Transactional(readOnly = true)
    public List<ConflictResDto> getUserConflicts(Long userId) {
        List<UserConflict> conflicts = conflictDao.findByUserId(userId);
        return conflicts.stream()
            .map(conflict -> {
                // 고급 AI 분석 결과가 있으면 해당 요약을 사용
                AiAnalysisResult advancedAnalysis = aiAnalysisResultDao.findByConflictId(conflict.getId()).orElse(null);
                
                ConflictResDto result = ConflictResDto.from(conflict);
                
                // 고급 분석 결과가 있으면 해당 분석으로 대체
                if (advancedAnalysis != null && advancedAnalysis.getConflictAnalysis() != null) {
                    return new ConflictResDto(
                        conflict.getId(),
                        conflict.getTitle(),
                        conflict.getDescription(),
                        conflict.getConflictType(),
                        conflict.getConflictWhen(),
                        conflict.getConflictFrequency(),
                        conflict.getParticipants(),
                        conflict.getDesiredOutcome(),
                        conflict.getPriority(),
                        conflict.getTalkWillingness(),
                        conflict.getInitialEmotion(),
                        conflict.getIntensity(),
                        advancedAnalysis.getConflictAnalysis(), // 고급 분석 결과 사용
                        conflict.getCreatedAt(),
                        conflict.getUpdatedAt()
                    );
                }
                
                return result; // 고급 분석이 없으면 기본 요약 사용
            })
            .collect(Collectors.toList());
    }
    
    // 갈등 삭제
    public void deleteConflict(Long conflictId, Long userId) {
        UserConflict conflict = conflictDao.findById(conflictId)
            .orElseThrow(() -> new IllegalArgumentException("갈등을 찾을 수 없습니다."));
        
        if (!conflict.getUserId().equals(userId)) {
            throw new IllegalArgumentException("삭제 권한이 없습니다.");
        }
        
        conflictDao.deleteById(conflictId);
    }
    
    // 사용자별 갈등 개수 조회
    @Transactional(readOnly = true)
    public int getUserConflictCount(Long userId) {
        return conflictDao.countByUserId(userId);
    }
    
    /**
     * Redis에서 저장된 고급 분석 결과 조회 (다른 서비스 이용 후 복귀 시 사용)
     */
    public Map<String, Object> getCachedAnalysisResult(String tempConflictId) {
        Map<String, Object> analysisResult = conflictRedisService.getAnalysisResult(tempConflictId);
        if (analysisResult != null) {
            log.info("Redis에서 캐시된 분석 결과 조회 성공: {}", tempConflictId);
            return analysisResult;
        } else {
            log.info("Redis에 저장된 분석 결과가 없음: {}", tempConflictId);
            return null;
        }
    }
    
    // 갈등의 AI 분석 결과 조회
    @Transactional(readOnly = true)
    public AiAnalysisResult getConflictAnalysis(Long conflictId, Long userId) {
        // 갈등 소유권 확인
        UserConflict conflict = conflictDao.findById(conflictId)
            .orElseThrow(() -> new IllegalArgumentException("갈등을 찾을 수 없습니다."));
        
        if (!conflict.getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }
        
        // AI 분석 결과 조회
        return aiAnalysisResultDao.findByConflictId(conflictId)
            .orElse(null); // 분석 결과가 없으면 null 반환
    }
    
    /**
     * Redis에서 가져온 객체를 안전하게 String으로 변환
     */
    private String convertObjectToString(Object obj) {
        if (obj == null) return null;
        if (obj instanceof String) return (String) obj;
        if (obj instanceof Map || obj instanceof List) {
            // JSON 객체/배열인 경우 문자열로 변환
            try {
                return obj.toString(); // 간단한 변환
            } catch (Exception e) {
                log.warn("객체를 문자열로 변환 실패: {}", e.getMessage());
                return obj.toString();
            }
        }
        return obj.toString();
    }
    
    /**
     * recommended_actions JSON에서 해결방안 텍스트 추출
     */
    private String extractSolutionsFromRecommendedActions(String recommendedActions) {
        if (recommendedActions == null) return null;
        
        try {
            // JSON 문자열인 경우 간단한 파싱으로 처리
            if (recommendedActions.startsWith("{") && recommendedActions.contains("immediate")) {
                // JSON 구조에서 주요 행동 지침들을 추출
                StringBuilder solutions = new StringBuilder();
                solutions.append("🔍 즉시 행동:\n");
                
                // 간단한 문자열 추출 (정규식 사용)
                String immediate = extractArrayFromJson(recommendedActions, "immediate");
                if (immediate != null) solutions.append(immediate).append("\n\n");
                
                solutions.append("📋 단기 계획:\n");
                String shortTerm = extractArrayFromJson(recommendedActions, "shortTerm");
                if (shortTerm != null) solutions.append(shortTerm).append("\n\n");
                
                solutions.append("🎯 중기 계획:\n");
                String midTerm = extractArrayFromJson(recommendedActions, "midTerm");
                if (midTerm != null) solutions.append(midTerm);
                
                return solutions.toString();
            }
            return recommendedActions; // JSON이 아니면 그대로 반환
        } catch (Exception e) {
            log.warn("recommended_actions 파싱 실패: {}", e.getMessage());
            return recommendedActions; // 파싱 실패시 원본 반환
        }
    }
    
    /**
     * JSON 문자열에서 배열 값들을 추출하여 문자열로 변환
     */
    private String extractArrayFromJson(String json, String key) {
        try {
            String pattern = "\"" + key + "\":\\[([^\\]]+)\\]";
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = p.matcher(json);
            if (m.find()) {
                String arrayContent = m.group(1);
                // 따옴표 제거하고 항목들을 줄바꿈으로 구분
                return arrayContent.replaceAll("\"", "")
                                 .replaceAll(",", "\n• ")
                                 .replaceFirst("^", "• ");
            }
        } catch (Exception e) {
            log.debug("JSON 배열 추출 실패: {}", e.getMessage());
        }
        return null;
    }
}