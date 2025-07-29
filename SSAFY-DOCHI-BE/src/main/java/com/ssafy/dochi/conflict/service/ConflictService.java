package com.ssafy.dochi.conflict.service;

import com.ssafy.dochi.conflict.dao.ConflictDao;
import com.ssafy.dochi.conflict.domain.UserConflict;
import com.ssafy.dochi.conflict.dto.request.ConflictCreateReqDto;
import com.ssafy.dochi.conflict.dto.request.ConflictSummaryReqDto;
import com.ssafy.dochi.conflict.dto.response.ConflictResDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ConflictService {
    
    private final ConflictDao conflictDao;
    private final AiSummaryService aiSummaryService;
    
    // 갈등 생성
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