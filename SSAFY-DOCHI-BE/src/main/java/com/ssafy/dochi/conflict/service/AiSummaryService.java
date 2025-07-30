package com.ssafy.dochi.conflict.service;

import com.ssafy.dochi.conflict.domain.UserConflict.ConflictType;
import com.ssafy.dochi.conflict.dto.response.AiAnalysisResDto;
import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
public class AiSummaryService {
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${ai.service.url:http://localhost:8001}")
    private String aiServiceUrl;
    
    public AiAnalysisResDto generateAnalysis(String description, ConflictType conflictType) {
        try {
            // AI 서비스 호출
            return callAiService(description, conflictType);
        } catch (Exception e) {
            log.error("AI 분석 생성 중 오류 발생", e);
            // AI 서비스 호출 실패 시 fallback으로 간단한 분석 제공
            return generateSimpleAnalysis(description, conflictType);
        }
    }
    
    private AiAnalysisResDto callAiService(String description, ConflictType conflictType) {
        try {
            // AI 서비스에 요청할 데이터 구성
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("original_text", description + " (갈등 유형: " + getKoreanConflictType(conflictType) + ")");
            
            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            // AI 서비스 호출
            ResponseEntity<Map> response = restTemplate.postForEntity(
                aiServiceUrl + "/api/summary/", entity, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String aiSummary = (String) response.getBody().get("summary_text");
                
                // AI 요약을 바탕으로 해결방안 생성
                String solutions = generateSolutionsFromSummary(aiSummary, conflictType);
                
                return AiAnalysisResDto.builder()
                    .summary(aiSummary)
                    .solutions(solutions)
                    .build();
            } else {
                throw new RuntimeException("AI 서비스 응답 오류");
            }
        } catch (Exception e) {
            log.error("AI 서비스 호출 실패: {}", e.getMessage());
            throw e;
        }
    }
    
    private String generateSolutionsFromSummary(String summary, ConflictType conflictType) {
        StringBuilder solutions = new StringBuilder();
        
        // 갈등 유형별 기본 해결방안
        solutions.append(getBasicSolutionsByType(conflictType));
        
        // AI 요약을 바탕으로 추가 해결방안 제안
        if (summary.contains("감정") || summary.contains("화") || summary.contains("분노")) {
            solutions.append("\n\n💡 감정 관리 방안:\n");
            solutions.append("   • 감정이 격해질 때는 잠시 시간을 가지고 대화하기\n");
            solutions.append("   • 심호흡이나 명상을 통한 감정 조절\n");
            solutions.append("   • 감정일기 작성으로 자신의 감정 파악\n");
        }
        
        if (summary.contains("소통") || summary.contains("대화") || summary.contains("오해")) {
            solutions.append("\n\n🗣️ 의사소통 개선 방안:\n");
            solutions.append("   • 명확하고 구체적인 표현 사용하기\n");
            solutions.append("   • 상대방의 말을 끝까지 들어보기\n");
            solutions.append("   • 이해했는지 확인하는 질문하기\n");
        }
        
        return solutions.toString();
    }
    
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
    
    private String getBasicSolutionsByType(ConflictType conflictType) {
        switch (conflictType) {
            case WORK:
                return "🏢 업무 관련 갈등 해결 방안:\n" +
                       "   • 상사나 HR 부서와 상담하여 중재 요청\n" +
                       "   • 명확한 업무 분담과 의사소통 채널 구축\n" +
                       "   • 정기적인 팀 미팅을 통한 갈등 예방";
            case FAMILY:
                return "👨‍👩‍👧‍👦 가족 간 갈등 해결 방안:\n" +
                       "   • 가족 회의를 통한 열린 대화의 장 마련\n" +
                       "   • 서로의 입장을 이해하는 시간 갖기\n" +
                       "   • 필요시 가족 상담 전문가의 도움 받기";
            case FRIEND:
                return "👫 친구 관계 갈등 해결 방안:\n" +
                       "   • 솔직하고 진실한 대화를 통한 오해 해소\n" +
                       "   • 서로의 경계선 존중하기\n" +
                       "   • 필요하면 잠시 거리를 두고 냉정하게 생각해보기";
            case COUPLE:
                return "💑 연인/부부 갈등 해결 방안:\n" +
                       "   • 감정이 격해질 때는 잠시 시간을 가지고 대화하기\n" +
                       "   • 'I' 메시지로 자신의 감정을 표현하기\n" +
                       "   • 커플 상담을 통한 전문적인 도움 받기";
            default:
                return "🤝 일반적인 갈등 해결 방안:\n" +
                       "   • 냉정하게 상황을 분석하고 감정 조절하기\n" +
                       "   • 상대방의 입장에서 생각해보기\n" +
                       "   • 건설적인 대화를 통한 해결책 모색";
        }
    }
    
    public String generateSummary(String description, ConflictType conflictType) {
        return generateAnalysis(description, conflictType).getSummary();
    }
    
    private AiAnalysisResDto generateSimpleAnalysis(String description, ConflictType conflictType) {
        // 요약 생성
        String summary = generateSimpleSummary(description, conflictType);
        
        // 해결방안 생성
        String solutions = generateSolutions(description, conflictType);
        
        return AiAnalysisResDto.builder()
            .summary(summary)
            .solutions(solutions)
            .build();
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
        
        summary.append("상호 이해와 소통을 통한 해결이 필요한 상황입니다.");
        
        return summary.toString();
    }
    
    private String generateSolutions(String description, ConflictType conflictType) {
        StringBuilder solutions = new StringBuilder();
        
        // 갈등 유형별 기본 해결방안
        switch (conflictType) {
            case WORK:
                solutions.append("1. 업무 관련 갈등 해결 방안:\n");
                solutions.append("   • 상사나 HR 부서와 상담하여 중재 요청\n");
                solutions.append("   • 명확한 업무 분담과 의사소통 채널 구축\n");
                solutions.append("   • 정기적인 팀 미팅을 통한 갈등 예방\n");
                break;
            case FAMILY:
                solutions.append("1. 가족 간 갈등 해결 방안:\n");
                solutions.append("   • 가족 회의를 통한 열린 대화의 장 마련\n");
                solutions.append("   • 서로의 입장을 이해하는 시간 갖기\n");
                solutions.append("   • 필요시 가족 상담 전문가의 도움 받기\n");
                break;
            case FRIEND:
                solutions.append("1. 친구 관계 갈등 해결 방안:\n");
                solutions.append("   • 솔직하고 진실한 대화를 통한 오해 해소\n");
                solutions.append("   • 서로의 경계선 존중하기\n");
                solutions.append("   • 필요하면 잠시 거리를 두고 냉정하게 생각해보기\n");
                break;
            case COUPLE:
                solutions.append("1. 연인/부부 갈등 해결 방안:\n");
                solutions.append("   • 감정이 격해질 때는 잠시 시간을 가지고 대화하기\n");
                solutions.append("   • 'I' 메시지로 자신의 감정을 표현하기\n");
                solutions.append("   • 커플 상담을 통한 전문적인 도움 받기\n");
                break;
            default:
                solutions.append("1. 일반적인 갈등 해결 방안:\n");
                solutions.append("   • 냉정하게 상황을 분석하고 감정 조절하기\n");
                solutions.append("   • 상대방의 입장에서 생각해보기\n");
                solutions.append("   • 건설적인 대화를 통한 해결책 모색\n");
        }
        
        // 키워드 기반 추가 해결방안
        if (description.contains("화가") || description.contains("분노") || description.contains("짜증")) {
            solutions.append("\n2. 감정 관리 방안:\n");
            solutions.append("   • 심호흡이나 명상을 통한 감정 조절\n");
            solutions.append("   • 감정일기 작성으로 자신의 감정 파악\n");
            solutions.append("   • 스트레스 해소를 위한 운동이나 취미 활동\n");
        }
        
        if (description.contains("오해") || description.contains("misunderstand")) {
            solutions.append("\n2. 의사소통 개선 방안:\n");
            solutions.append("   • 명확하고 구체적인 표현 사용하기\n");
            solutions.append("   • 상대방의 말을 끝까지 들어보기\n");
            solutions.append("   • 이해했는지 확인하는 질문하기\n");
        }
        
        if (description.contains("자주") || description.contains("반복") || description.contains("계속")) {
            solutions.append("\n2. 근본적 해결 방안:\n");
            solutions.append("   • 갈등의 근본 원인 분석하기\n");
            solutions.append("   • 예방을 위한 시스템이나 규칙 만들기\n");
            solutions.append("   • 전문가의 도움을 받아 패턴 분석하기\n");
        }
        
        solutions.append("\n💡 추천: 갈등 해결 후에는 재발 방지를 위한 예방책도 함께 논의해보세요.");
        
        return solutions.toString();
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