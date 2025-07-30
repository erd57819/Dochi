package com.ssafy.dochi.conflict.service;

import com.ssafy.dochi.conflict.dao.ConflictDao;
import com.ssafy.dochi.conflict.domain.UserConflict;
import com.ssafy.dochi.conflict.dto.request.ConflictCreateReqDto;
import com.ssafy.dochi.conflict.dto.request.ConflictSummaryReqDto;
import com.ssafy.dochi.conflict.dto.response.AiAnalysisResDto;
import com.ssafy.dochi.conflict.dto.response.ConflictResDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ConflictService {
    
    private final ConflictDao conflictDao;
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
     * 2-1단계: 고급 AI 분석 (감정, 관계, 소통 등) - 임시 분석만 (저장 안함)
     */
    public Map<String, Object> analyzeConflictAdvanced(String tempConflictId) {
        ConflictCreateReqDto conflictData = conflictRedisService.getTempConflict(tempConflictId);
        return aiSummaryService.generateAdvancedAnalysis(conflictData.getDescription(), conflictData.getConflictType());
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
    
    // 사용자별 갈등 목록 조회
    @Transactional(readOnly = true)
    public List<ConflictResDto> getUserConflicts(Long userId) {
        List<UserConflict> conflicts = conflictDao.findByUserId(userId);
        return conflicts.stream()
            .map(ConflictResDto::from)
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
}