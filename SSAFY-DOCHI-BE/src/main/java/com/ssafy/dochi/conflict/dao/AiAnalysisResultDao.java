package com.ssafy.dochi.conflict.dao;

import com.ssafy.dochi.conflict.domain.AiAnalysisResult;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Optional;

@Mapper
public interface AiAnalysisResultDao {
    
    // AI 분석 결과 저장
    void save(AiAnalysisResult analysisResult);
    
    // AI 분석 결과 조회 (ID로)
    Optional<AiAnalysisResult> findById(Long id);
    
    // 갈등 ID로 AI 분석 결과 조회
    Optional<AiAnalysisResult> findByConflictId(Long conflictId);
    
    // 사용자별 AI 분석 결과 목록 조회
    List<AiAnalysisResult> findByUserId(Long userId);
    
    // AI 분석 결과 수정
    void update(AiAnalysisResult analysisResult);
    
    // AI 분석 결과 삭제
    void deleteById(Long id);
    
    // 갈등 ID로 AI 분석 결과 삭제
    void deleteByConflictId(Long conflictId);
}