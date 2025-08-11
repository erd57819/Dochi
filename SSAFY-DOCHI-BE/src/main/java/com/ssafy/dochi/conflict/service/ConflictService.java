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
     * 2단계: Redis에서 갈등 데이터 조회 및 AI 분석
     */
    public AiAnalysisResDto analyzeConflict(String tempConflictId) {
        ConflictCreateReqDto conflictData = conflictRedisService.getTempConflict(tempConflictId);
        return aiSummaryService.generateAnalysis(conflictData.getDescription(), conflictData.getConflictType());
    }
    
    /**
     * 2-1단계: 고급 AI 분석 (감정, 관계, 소통 등) - Redis에 결과 저장
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
        Map<String, Object> analysisResult = aiSummaryService.generateAdvancedAnalysis(
            conflictData.getDescription(), conflictData.getConflictType());
        
        // 분석 결과를 Redis에 저장
        conflictRedisService.saveAnalysisResult(tempConflictId, analysisResult);
        
        return analysisResult;
    }
    
    /**
     * 2-2단계: 고급 AI 분석 후 갈등 저장 및 분석 결과 MySQL 저장
     */
    public ConflictResDto analyzeAndSaveConflictAdvanced(Long userId, String tempConflictId) {
        // Redis에서 갈등 데이터 조회
        ConflictCreateReqDto conflictData = conflictRedisService.getTempConflict(tempConflictId);
        
        // 고급 AI 분석 수행
        Map<String, Object> analysisResult = aiSummaryService.generateAdvancedAnalysis(
            conflictData.getDescription(), conflictData.getConflictType());
        
        // 기본 AI 분석도 수행 (요약 및 해결방안)
        AiAnalysisResDto basicAnalysis = aiSummaryService.generateAnalysis(
            conflictData.getDescription(), conflictData.getConflictType());
        
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
            basicAnalysis.getSummary() + "\n\n[해결방안]\n" + basicAnalysis.getSolutions()
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
     * 3단계: AI 분석 완료 후 최종 SQL 저장
     */
    public ConflictResDto finalizeConflict(Long userId, String tempConflictId, String aiSummary, String aiSolutions) {
        // Redis에서 갈등 데이터 조회
        ConflictCreateReqDto reqDto = conflictRedisService.getTempConflict(tempConflictId);
        
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
            aiSummary + "\n\n[해결방안]\n" + aiSolutions // AI 요약과 해결방안을 합쳐서 저장
        );
        
        // SQL에 최종 저장
        conflictDao.save(conflict);
        
        // Redis에서 임시 데이터 삭제
        conflictRedisService.deleteTempConflict(tempConflictId);
        // 분석 결과도 삭제
        conflictRedisService.deleteAnalysisResult(tempConflictId);
        
        return ConflictResDto.from(conflict);
    }
    
    /**
     * 기존 방식 유지 (호환성을 위해)
     */
    public ConflictResDto createConflict(Long userId, ConflictCreateReqDto reqDto) {
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
            reqDto.getAiSummary()
        );
        
        conflictDao.save(conflict);
        return ConflictResDto.from(conflict);
    }
    
    // AI 요약 생성
    public String generateAiSummary(ConflictSummaryReqDto reqDto) {
        return aiSummaryService.generateSummary(reqDto.getDescription(), reqDto.getConflictType());
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
}