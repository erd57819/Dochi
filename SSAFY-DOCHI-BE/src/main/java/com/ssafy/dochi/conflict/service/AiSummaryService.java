package com.ssafy.dochi.conflict.service;

import com.ssafy.dochi.conflict.dao.AiAnalysisResultDao;
import com.ssafy.dochi.conflict.domain.AiAnalysisResult;
import com.ssafy.dochi.conflict.domain.UserConflict.ConflictType;
import com.ssafy.dochi.conflict.dto.response.AiAnalysisResDto;
import com.ssafy.dochi.config.GmsAiClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiSummaryService {
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final AiAnalysisResultDao aiAnalysisResultDao;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final GmsAiClient gmsAiClient;
    
    @Value("${ai.service.url:http://localhost:8002}")
    private String aiServiceUrl;
    
    public AiAnalysisResDto generateAnalysis(String description, ConflictType conflictType) {
        try {
            // 먼저 GMS API 직접 호출 시도
            return callGmsDirectly(description, conflictType);
        } catch (Exception e) {
            log.warn("GMS 직접 호출 실패, AI 서비스로 fallback: {}", e.getMessage());
            try {
                // AI 서비스 호출
                return callAiService(description, conflictType);
            } catch (Exception e2) {
                log.error("AI 분석 생성 중 오류 발생", e2);
                // AI 서비스 호출 실패 시 fallback으로 간단한 분석 제공
                return generateSimpleAnalysis(description, conflictType);
            }
        }
    }
    
    private AiAnalysisResDto callGmsDirectly(String description, ConflictType conflictType) {
        try {
            String conflictTypeKorean = getKoreanConflictType(conflictType);
            
            // 갈등 분석을 위한 프롬프트 구성
            String analysisPrompt = String.format(
                "다음은 %s 관련 갈등 상황입니다. 이를 분석하여 요약과 해결방안을 제시해주세요.\n\n" +
                "갈등 내용: %s\n\n" +
                "다음 형식으로 응답해주세요:\n" +
                "=== 갈등 상황 분석 ===\n" +
                "[갈등의 핵심 내용과 원인을 2-3문장으로 요약]\n\n" +
                "=== 해결 방안 ===\n" +
                "[구체적이고 실용적인 해결방안을 3-5개 제시]",
                conflictTypeKorean, description
            );
            
            // GMS API 호출
            String gmsResponse = gmsAiClient.ask(analysisPrompt, "gpt-4o-mini");
            
            // 응답이 실패 메시지인 경우 예외 던지기
            if (gmsResponse.startsWith("GMS 호출 실패:")) {
                throw new RuntimeException(gmsResponse);
            }
            
            // 응답 파싱
            String[] sections = gmsResponse.split("=== 해결 방안 ===");
            String summary = "";
            String solutions = "";
            
            if (sections.length >= 1) {
                summary = sections[0].replace("=== 갈등 상황 분석 ===", "").trim();
            }
            
            if (sections.length >= 2) {
                solutions = sections[1].trim();
            }
            
            // 파싱이 실패한 경우 전체 응답을 요약으로 사용
            if (summary.isEmpty()) {
                summary = gmsResponse.length() > 200 ? gmsResponse.substring(0, 200) + "..." : gmsResponse;
            }
            
            if (solutions.isEmpty()) {
                solutions = getBasicSolutionsByType(conflictType);
            }
            
            return AiAnalysisResDto.builder()
                .summary(summary)
                .solutions(solutions)
                .build();
                
        } catch (Exception e) {
            log.error("GMS 직접 호출 실패: {}", e.getMessage());
            throw new RuntimeException("GMS API 호출 실패: " + e.getMessage(), e);
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
    
    public Map<String, Object> generateAdvancedAnalysis(String description, ConflictType conflictType) {
        try {
            // 먼저 GMS를 사용한 고급 분석 시도
            return generateAdvancedAnalysisWithGMS(description, conflictType);
        } catch (Exception e) {
            log.warn("GMS 고급 분석 실패, AI 서비스로 fallback: {}", e.getMessage());
            try {
                // AI 서비스에 고급 분석 요청
                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("original_text", description);
                requestBody.put("conflict_type", getKoreanConflictType(conflictType));
                
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
                
                ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/summary/advanced", entity, Map.class);
                
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    return response.getBody();
                } else {
                    throw new RuntimeException("AI 고급 분석 서비스 응답 오류");
                }
            } catch (Exception e2) {
                log.error("AI 고급 분석 실패: {}", e2.getMessage());
                // 실질적인 기본 분석 제공
                return generatePracticalFallbackAnalysis(description, conflictType);
            }
        }
    }
    
    private Map<String, Object> generateAdvancedAnalysisWithGMS(String description, ConflictType conflictType) {
        String conflictTypeKorean = getKoreanConflictType(conflictType);
        
        // 고급 분석을 위한 상세 프롬프트
        String analysisPrompt = String.format(
            "당신은 갈등 해결 전문가입니다. 다음 %s 갈등 상황을 분석하고 실질적인 해결방안을 제시해주세요.\n\n" +
            "갈등 상황: %s\n\n" +
            "다음 형식으로 분석해주세요:\n\n" +
            "=== 감정 분석 ===\n" +
            "[현재 감정 상태와 그 원인, 감정이 갈등에 미치는 영향을 구체적으로 분석]\n\n" +
            "=== 갈등 원인 분석 ===\n" +
            "[갈등의 근본 원인과 표면적 원인을 구분하여 분석]\n\n" +
            "=== 실질적 해결 방안 ===\n" +
            "[단계별로 실행 가능한 구체적 해결 방법 3-5가지 제시]",
            conflictTypeKorean, description
        );
        
        String gmsResponse = gmsAiClient.ask(analysisPrompt, "gpt-4o-mini");
        
        if (gmsResponse.startsWith("GMS 호출 실패:")) {
            throw new RuntimeException(gmsResponse);
        }
        
        // 응답 파싱
        Map<String, Object> result = new HashMap<>();
        
        try {
            String[] sections = gmsResponse.split("=== ");
            String emotionAnalysis = "";
            String conflictAnalysis = "";
            String solutions = "";
            
            for (String section : sections) {
                if (section.startsWith("감정 분석")) {
                    emotionAnalysis = section.replace("감정 분석 ===\n", "").trim();
                } else if (section.startsWith("갈등 원인 분석")) {
                    conflictAnalysis = section.replace("갈등 원인 분석 ===\n", "").trim();
                } else if (section.startsWith("실질적 해결 방안")) {
                    solutions = section.replace("실질적 해결 방안 ===\n", "").trim();
                }
            }
            
            // 파싱이 실패한 경우 전체 응답에서 추출
            if (emotionAnalysis.isEmpty() && conflictAnalysis.isEmpty()) {
                String[] lines = gmsResponse.split("\n");
                StringBuilder sb = new StringBuilder();
                for (String line : lines) {
                    if (!line.startsWith("===") && !line.trim().isEmpty()) {
                        sb.append(line).append(" ");
                    }
                }
                String fullText = sb.toString().trim();
                emotionAnalysis = fullText.substring(0, Math.min(200, fullText.length()));
                conflictAnalysis = fullText.substring(Math.min(200, fullText.length()));
            }
            
            result.put("emotion_analysis", emotionAnalysis.isEmpty() ? "AI가 감정 상태를 분석하여 맞춤형 조언을 제공합니다." : emotionAnalysis);
            result.put("conflict_analysis", conflictAnalysis.isEmpty() ? "갈등의 근본 원인을 파악하여 해결 방향을 제시합니다." : conflictAnalysis);
            result.put("recommended_actions", parseActionsFromSolutions(solutions));
            result.put("priority_recommendation", generatePriorityRecommendation(description, conflictType));
            
            return result;
            
        } catch (Exception e) {
            log.error("GMS 응답 파싱 실패: {}", e.getMessage());
            throw new RuntimeException("GMS 분석 결과 처리 실패", e);
        }
    }
    
    private Map<String, Object> generatePracticalFallbackAnalysis(String description, ConflictType conflictType) {
        Map<String, Object> analysis = new HashMap<>();
        
        // 키워드 기반 실질적 분석
        String emotionAnalysis = analyzeEmotionFromText(description);
        String conflictAnalysis = analyzeConflictFromText(description, conflictType);
        List<String> practicalActions = generatePracticalActions(description, conflictType);
        String priorityRecommendation = generatePriorityRecommendation(description, conflictType);
        
        analysis.put("emotion_analysis", emotionAnalysis);
        analysis.put("conflict_analysis", conflictAnalysis);
        analysis.put("recommended_actions", practicalActions);
        analysis.put("priority_recommendation", priorityRecommendation);
        
        return analysis;
    }
    
    private String analyzeEmotionFromText(String description) {
        StringBuilder analysis = new StringBuilder();
        
        if (description.contains("화") || description.contains("분노") || description.contains("짜증")) {
            analysis.append("현재 분노와 좌절감이 주된 감정으로 나타나고 있습니다. ");
            analysis.append("이러한 강한 감정은 갈등을 더욱 복잡하게 만들 수 있으므로, 먼저 감정을 조절하는 것이 중요합니다.");
        } else if (description.contains("슬프") || description.contains("우울") || description.contains("실망")) {
            analysis.append("슬픔과 실망감이 깊게 자리잡고 있는 상황입니다. ");
            analysis.append("이는 기대했던 것과 현실 사이의 괴리에서 오는 자연스러운 반응이며, 충분한 회복 시간이 필요합니다.");
        } else if (description.contains("불안") || description.contains("걱정") || description.contains("두려")) {
            analysis.append("불안감과 걱정이 갈등 상황을 더욱 어렵게 만들고 있습니다. ");
            analysis.append("미래에 대한 불확실성이 스트레스를 가중시키고 있으므로, 구체적인 계획 수립이 도움될 것입니다.");
        } else {
            analysis.append("복합적인 감정이 얽혀있는 상황으로 보입니다. ");
            analysis.append("감정을 정리하고 객관적으로 상황을 바라보는 시각이 필요한 시점입니다.");
        }
        
        return analysis.toString();
    }
    
    private String analyzeConflictFromText(String description, ConflictType conflictType) {
        StringBuilder analysis = new StringBuilder();
        
        // 갈등 유형별 분석
        switch (conflictType) {
            case WORK:
                analysis.append("직장 내 갈등은 대부분 업무 방식이나 의사소통 문제에서 비롯됩니다. ");
                break;
            case FAMILY:
                analysis.append("가족 간 갈등은 서로 다른 가치관과 기대치의 차이에서 발생합니다. ");
                break;
            case COUPLE:
                analysis.append("연인/부부 간 갈등은 상호 이해와 소통의 부족이 주요 원인입니다. ");
                break;
            case FRIEND:
                analysis.append("친구 관계의 갈등은 대개 오해나 서로 다른 기대에서 시작됩니다. ");
                break;
            default:
                analysis.append("이 갈등은 다양한 요인이 복합적으로 작용하고 있는 상황입니다. ");
        }
        
        // 키워드 기반 세부 분석
        if (description.contains("돈") || description.contains("비용") || description.contains("경제")) {
            analysis.append("경제적 이해관계가 갈등의 핵심 요소로 작용하고 있습니다. ");
        }
        if (description.contains("시간") || description.contains("약속")) {
            analysis.append("시간 관리나 약속에 대한 인식 차이가 문제의 원인 중 하나입니다. ");
        }
        if (description.contains("무시") || description.contains("존중")) {
            analysis.append("상호 존중의 부족이 갈등을 심화시키고 있는 상황입니다. ");
        }
        
        analysis.append("근본적인 해결을 위해서는 서로의 입장을 이해하고 공통의 해결책을 찾는 것이 중요합니다.");
        
        return analysis.toString();
    }
    
    private List<String> generatePracticalActions(String description, ConflictType conflictType) {
        List<String> actions = new ArrayList<>();
        
        // 갈등 유형별 맞춤 행동 제안
        switch (conflictType) {
            case WORK:
                actions.add("상사나 HR 담당자와 상담하여 객관적인 중재 요청하기");
                actions.add("업무 역할과 책임을 명확히 정의하고 문서화하기");
                actions.add("정기적인 팀 미팅을 통해 소통 채널 구축하기");
                break;
            case FAMILY:
                actions.add("가족 회의를 열어 모든 구성원의 의견을 듣는 시간 갖기");
                actions.add("서로의 입장을 이해하기 위한 개별 대화 시간 마련하기");
                actions.add("가족 상담 전문가의 도움을 받아 객관적 시각 확보하기");
                break;
            case COUPLE:
                actions.add("'I 메시지'를 사용하여 자신의 감정을 솔직하게 표현하기");
                actions.add("상대방의 말을 끝까지 들어보고 공감하려 노력하기");
                actions.add("커플 상담을 통해 소통 방법 개선하기");
                break;
            case FRIEND:
                actions.add("오해가 있었는지 솔직하게 확인해보기");
                actions.add("서로의 경계선을 존중하는 새로운 관계 룰 정하기");
                actions.add("시간을 두고 감정이 정리된 후 대화 시도하기");
                break;
            default:
                actions.add("갈등 상황을 객관적으로 정리하고 핵심 이슈 파악하기");
                actions.add("상대방과 차분한 환경에서 대화할 기회 만들기");
                actions.add("필요시 신뢰할 만한 제3자의 조언이나 중재 요청하기");
        }
        
        // 공통 행동 추가
        actions.add("감정이 격해질 때는 잠시 시간을 두고 냉정하게 생각하기");
        actions.add("갈등 해결 후 관계 개선을 위한 구체적 계획 세우기");
        
        return actions;
    }
    
    private List<String> parseActionsFromSolutions(String solutions) {
        if (solutions.isEmpty()) {
            return List.of("전문가의 조언을 구하는 것을 권장합니다.");
        }
        
        List<String> actions = new ArrayList<>();
        String[] lines = solutions.split("\n");
        
        for (String line : lines) {
            line = line.trim();
            if (!line.isEmpty() && !line.startsWith("===")) {
                // 불필요한 기호 제거
                line = line.replaceAll("^[\\d\\-\\*•]+\\s*", "");
                if (line.length() > 10) { // 너무 짧은 텍스트 제외
                    actions.add(line);
                }
            }
        }
        
        return actions.isEmpty() ? List.of("상황에 맞는 맞춤형 해결 방안을 제시해드립니다.") : actions;
    }
    
    private String generatePriorityRecommendation(String description, ConflictType conflictType) {
        if (description.contains("폭력") || description.contains("위협") || description.contains("심각")) {
            return "즉각적인 전문가 개입이 필요한 심각한 상황입니다. 안전을 최우선으로 고려하세요.";
        } else if (description.contains("오랫동안") || description.contains("반복") || description.contains("계속")) {
            return "장기간 지속된 갈등으로 전문적인 상담이나 중재가 도움이 될 것입니다.";
        } else if (conflictType == ConflictType.COUPLE || conflictType == ConflictType.FAMILY) {
            return "관계의 소중함을 고려하여 신중하고 따뜻한 접근이 필요합니다.";
        } else {
            return "차분한 대화와 상호 이해를 통해 해결 가능한 상황으로 보입니다.";
        }
    }
    
    /**
     * 고급 AI 분석 결과를 MySQL에 저장
     */
    public void saveAdvancedAnalysisResult(Long conflictId, Long userId, Map<String, Object> analysisResult) {
        try {
            // 분석 결과에서 필요한 데이터 추출
            String emotionAnalysis = (String) analysisResult.get("emotion_analysis");
            String conflictAnalysis = (String) analysisResult.get("conflict_analysis");
            Integer relationshipHealthScore = (Integer) analysisResult.get("relationship_health_score");
            Integer communicationScore = (Integer) analysisResult.get("communication_score");
            String priorityRecommendation = (String) analysisResult.get("priority_recommendation");
            
            // JSON 필드들을 문자열로 변환
            String trustScore = objectMapper.writeValueAsString(analysisResult.get("trust_score"));
            String cooperationScore = objectMapper.writeValueAsString(analysisResult.get("cooperation_score"));
            String recommendedActions = objectMapper.writeValueAsString(analysisResult.get("recommended_actions"));
            
            // AiAnalysisResult 객체 생성 및 저장
            AiAnalysisResult result = new AiAnalysisResult(
                conflictId, userId, emotionAnalysis, conflictAnalysis, relationshipHealthScore,
                trustScore, communicationScore, cooperationScore, priorityRecommendation, recommendedActions
            );
            
            aiAnalysisResultDao.save(result);
            log.info("AI 고급 분석 결과가 저장되었습니다. conflict_id: {}", conflictId);
            
        } catch (Exception e) {
            log.error("AI 고급 분석 결과 저장 실패: {}", e.getMessage(), e);
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