package com.ssafy.dochi.conflict.service;

import com.ssafy.dochi.conflict.domain.UserConflict.ConflictType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiSummaryService {
    
    // TODO: OpenAI API 연동 시 실제 구현
    // 현재는 간단한 요약 로직으로 구현
    
    public String generateSummary(String description, ConflictType conflictType) {
        try {
            // 간단한 키워드 기반 요약 (추후 OpenAI API로 대체)
            return generateSimpleSummary(description, conflictType);
        } catch (Exception e) {
            log.error("AI 요약 생성 중 오류 발생", e);
            return "요약 생성에 실패했습니다. 나중에 다시 시도해주세요.";
        }
    }
    
    private String generateSimpleSummary(String description, ConflictType conflictType) {
        StringBuilder summary = new StringBuilder();
        
        // 갈등 유형별 맞춤형 접두사
        String typePrefix = getTypePrefix(conflictType);
        summary.append(typePrefix);
        
        // 텍스트 길이에 따른 요약
        if (description.length() <= 100) {
            summary.append("간단한 갈등 상황으로, ");
        } else if (description.length() <= 300) {
            summary.append("중간 정도의 복잡한 갈등 상황으로, ");
        } else {
            summary.append("복잡하고 다면적인 갈등 상황으로, ");
        }
        
        // 키워드 분석
        if (description.contains("화가") || description.contains("분노") || description.contains("짜증")) {
            summary.append("감정적인 요소가 강하게 나타나고 있습니다. ");
        }
        
        if (description.contains("오해") || description.contains("misunderstand")) {
            summary.append("의사소통의 문제가 주요 원인으로 보입니다. ");
        }
        
        if (description.contains("자주") || description.contains("반복") || description.contains("계속")) {
            summary.append("반복적으로 발생하는 패턴이 있어 근본적인 해결이 필요합니다. ");
        }
        
        // 해결 방향 제시
        summary.append("상호 이해와 소통을 통한 해결 방안을 모색해보는 것이 좋겠습니다.");
        
        return summary.toString();
    }
    
    private String getTypePrefix(ConflictType conflictType) {
        switch (conflictType) {
            case WORK:
                return "직장 내 갈등으로, ";
            case FAMILY:
                return "가족 간의 갈등으로, ";
            case FRIEND:
                return "친구 관계의 갈등으로, ";
            case COUPLE:
                return "연인/부부 간의 갈등으로, ";
            case NEIGHBOR:
                return "이웃 간의 갈등으로, ";
            case FINANCIAL:
                return "금전 관련 갈등으로, ";
            case ONLINE:
                return "온라인상의 갈등으로, ";
            default:
                return "일반적인 갈등으로, ";
        }
    }
}