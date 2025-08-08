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
            
            // 갈등 분석을 위한 프롬프트 구성 (요약 더 단축, 볼드 서식 추가)
            String analysisPrompt = String.format(
                "다음은 %s 관련 갈등 상황입니다. 핵심만 간결하게 분석해주세요.\n\n" +
                "갈등 내용: %s\n\n" +
                "다음 형식으로 응답하세요:\n" +
                "갈등 상황 분석:\n" +
                "핵심 원인과 문제점을 70-100자 이내로 요약하고, 중요한 키워드는 <strong>키워드</strong> HTML 태그로 강조하세요.\n\n" +
                "해결 방안:\n" +
                "1. 첫 번째 해결방안 (30-40자, 핵심 단어는 <strong>강조</strong>)\n" +
                "2. 두 번째 해결방안 (30-40자, 핵심 단어는 <strong>강조</strong>)\n" +
                "3. 세 번째 해결방안 (30-40자, 핵심 단어는 <strong>강조</strong>)",
                conflictTypeKorean, description
            );
            
            // GMS API 호출
            String gmsResponse = gmsAiClient.ask(analysisPrompt, "gpt-4o-mini");
            
            // 응답이 실패 메시지인 경우 예외 던지기
            if (gmsResponse.startsWith("GMS 호출 실패:")) {
                throw new RuntimeException(gmsResponse);
            }
            
            // 응답 파싱 (볼드 서식 유지, 다른 마크다운 제거)
            String[] sections = gmsResponse.split("해결 방안:");
            String summary = "";
            String solutions = "";
            
            if (sections.length >= 1) {
                summary = sections[0]
                    .replace("갈등 상황 분석:", "")
                    .replaceAll("[#\\-]{1,3}\\s*", "")  // # - 기호 제거
                    .replaceAll("__(.*?)__", "$1")  // __ 볼드 제거
                    .replaceAll("\\*((?!\\*).)*\\*", "$1")  // * 이탤릭 제거 (** 볼드는 유지)
                    .replaceAll("_((?!_).)_", "$1")  // _ 이탤릭 제거
                    .replaceAll("`(.*?)`", "$1")  // 코드 블록 제거
                    .trim();
            }
            
            if (sections.length >= 2) {
                solutions = sections[1]
                    .replaceAll("[#\\-]{1,3}\\s*", "")  // # - 기호 제거
                    .replaceAll("__(.*?)__", "$1")  // __ 볼드 제거
                    .replaceAll("\\*((?!\\*).)*\\*", "$1")  // * 이탤릭 제거 (** 볼드는 유지)
                    .replaceAll("_((?!_).)_", "$1")  // _ 이탤릭 제거
                    .replaceAll("`(.*?)`", "$1")  // 코드 블록 제거
                    .trim();
            }
            
            // 파싱이 실패한 경우 전체 응답을 요약으로 사용 (100자 제한)
            if (summary.isEmpty()) {
                summary = gmsResponse.length() > 100 ? gmsResponse.substring(0, 100) + "..." : gmsResponse;
            } else if (summary.length() > 100) {
                summary = summary.substring(0, 100) + "...";
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
        
        // 고도화된 갈등 분석 프롬프트 (더 단축, 볼드 서식 허용)
        String analysisPrompt = String.format(
            "당신은 갈등 해결 전문가입니다. 다음 %s 갈등 상황을 자세히 분석해주세요.\n\n" +
            "갈등 상황: %s\n\n" +
            "중요한 지침:\n" +
            "- 각 섹션별로 구체적이고 실용적인 내용을 작성하세요\n" +
            "- 중요한 키워드는 <strong>키워드</strong> HTML 태그로 강조하세요\n" +
            "- 목록 작성 시 마크다운(-)이 아닌 HTML <br> 태그를 사용하세요\n" +
            "- 일반적인 조언이 아닌, 이 특정 상황에 맞는 분석을 제공하세요\n" +
            "- 반드시 각 섹션에 완전한 분석 내용을 작성하세요\n\n" +
            "다음 형식으로 반드시 완전한 분석을 작성하세요:\n\n" +
            "=== 감정 분석 ===\n" +
            "이 갈등 상황에서 나타나는 구체적인 감정들을 HTML 형식으로 분석하세요:\n" +
            "<strong>표면 감정:</strong> [구체적으로 나타나는 감정들]<br>\n" +
            "<strong>숨겨진 진짜 감정:</strong> [내면 깊은 곳의 감정들]<br>\n" +
            "<strong>트리거:</strong> [감정을 자극하는 구체적인 요소들]<br>\n" +
            "<strong>건강한 감정 표현 방법:</strong> [구체적인 실행 방법]<br>" +
            "=== 갈등 원인 분석 ===\n" +
            "이 갈등의 구체적인 원인들을 HTML 형식으로 분석하세요:\n" +
            "<strong>즉각적 원인:</strong> [바로 드러나는 문제들]<br>\n" +
            "<strong>근본적 원인:</strong> [깊숙한 곳에 있는 진짜 문제들]<br>\n" +
            "<strong>소통 패턴의 문제점:</strong> [대화 방식의 구체적인 문제]<br>\n" +
            "<strong>상황적 요인:</strong> [환경이나 상황의 영향]<br>" +
            "=== 내 입장 분석 ===\n" +
            "갈등 상황에서 당신의 상태를 HTML 형식으로 분석하세요:\n" +
            "<strong>현재의 감정적 니즈:</strong> [지금 필요한 것들]<br>\n" +
            "<strong>갈등에서 원하는 진짜 결과:</strong> [진심으로 바라는 결과]<br>\n" +
            "<strong>무의식적 행동 패턴:</strong> [자신도 모르게 하는 행동들]<br>\n" +
            "<strong>변화가 필요한 부분:</strong> [개선해야 할 점들]<br>" +
            "=== 상대방 입장 분석 ===\n" +
            "상대방의 관점에서 상황을 HTML 형식으로 분석하세요:\n" +
            "<strong>상대방의 가능한 감정 상태:</strong> [상대방이 느낄 감정들]<br>\n" +
            "<strong>숨겨진 동기와 필요:</strong> [상대방이 진정 원하는 것]<br>\n" +
            "<strong>느끼는 압박감:</strong> [상대방이 받는 스트레스나 부담]<br>\n" +
            "<strong>상대방이 추구하는 가치:</strong> [상대방에게 중요한 것들]<br>" +
            "=== 실질적 해결 방안 ===\n" +
            "구체적이고 실행 가능한 해결 단계를 제시하세요:\n" +
            "1. 즉시 실행: [오늘 당장 할 수 있는 것]\n" +
            "2. 단기 해결: [1-2주 내에 할 수 있는 것]\n" +
            "3. 중기 회복: [1-3개월간 지속할 것]\n" +
            "4. 장기 예방: [3개월 이상 꾸준히 할 것]\n" +
            "5. 대안 계획: [해결되지 않을 때의 Plan B]",
            conflictTypeKorean, description
        );
        
        String gmsResponse = gmsAiClient.ask(analysisPrompt, "gpt-4o-mini");
        
        if (gmsResponse.startsWith("GMS 호출 실패:")) {
            throw new RuntimeException(gmsResponse);
        }
        
        // 디버그 로그 추가
        log.info("GMS 원본 응답: {}", gmsResponse);
        
        // 응답 파싱
        Map<String, Object> result = new HashMap<>();
        
        try {
            String[] sections = gmsResponse.split("=== ");
            String emotionAnalysis = "";
            String conflictAnalysis = "";
            String myPosition = "";
            String partnerPosition = "";
            String solutions = "";
            
            for (String section : sections) {
                if (section.startsWith("감정 분석")) {
                    emotionAnalysis = section.replace("감정 분석 ===", "")
                                            .replaceAll("\\n=== .*", "")  // 다음 섹션 제거
                                            .trim();
                } else if (section.startsWith("갈등 원인 분석")) {
                    conflictAnalysis = section.replace("갈등 원인 분석 ===", "")
                                             .replaceAll("\\n=== .*", "")  // 다음 섹션 제거
                                             .trim();
                } else if (section.startsWith("내 입장 분석")) {
                    myPosition = section.replace("내 입장 분석 ===", "")
                                       .replaceAll("\\n=== .*", "")  // 다음 섹션 제거
                                       .trim();
                } else if (section.startsWith("상대방 입장 분석")) {
                    partnerPosition = section.replace("상대방 입장 분석 ===", "")
                                            .replaceAll("\\n=== .*", "")  // 다음 섹션 제거
                                            .trim();
                } else if (section.startsWith("실질적 해결 방안")) {
                    solutions = section.replace("실질적 해결 방안 ===", "")
                                      .replaceAll("\\n=== .*", "")  // 다음 섹션 제거
                                      .trim();
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
            
            // 디버그 로그 추가
            log.info("파싱 결과 확인:");
            log.info("- emotionAnalysis: '{}'", emotionAnalysis);
            log.info("- conflictAnalysis: '{}'", conflictAnalysis);
            log.info("- myPosition: '{}'", myPosition);
            log.info("- partnerPosition: '{}'", partnerPosition);
            
            result.put("emotion_analysis", emotionAnalysis.isEmpty() ? "AI가 감정 상태를 분석하여 맞춤형 조언을 제공합니다." : emotionAnalysis);
            result.put("conflict_analysis", conflictAnalysis.isEmpty() ? "갈등의 근본 원인을 파악하여 해결 방향을 제시합니다." : conflictAnalysis);
            result.put("my_position", myPosition.isEmpty() ? generateMyPositionAnalysis(description, conflictType) : myPosition);
            result.put("partner_position", partnerPosition.isEmpty() ? generatePartnerPositionAnalysis(description, conflictType) : partnerPosition);
            result.put("recommended_actions", parseActionsIntoPhases(solutions));
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
        analysis.put("my_position", generateMyPositionAnalysis(description, conflictType));
        analysis.put("partner_position", generatePartnerPositionAnalysis(description, conflictType));
        analysis.put("recommended_actions", practicalActions);
        analysis.put("priority_recommendation", priorityRecommendation);
        
        return analysis;
    }
    
    private String analyzeEmotionFromText(String description) {
        try {
            String emotionPrompt = String.format(
                "당신은 감정 분석 전문가입니다. 다음 갈등 상황에서 드러나는 감정을 심층적으로 분석해주세요.\n\n" +
                "갈등 내용: %s\n\n" +
                "다음 형식으로 전문적인 감정 분석을 제공해주세요:\n" +
                "【표면 감정 분석】\n" +
                "- 현재 드러나는 주요 감정들\n" +
                "- 감정의 강도와 특성\n\n" +
                "【깊은 층위 감정】\n" +
                "- 표면 감정 뒤에 숨겨진 진짜 감정들\n" +
                "- 무의식적 감정과 욕구\n\n" +
                "【감정 트리거】\n" +
                "- 이 감정을 유발한 구체적 요인들\n" +
                "- 과거 경험과의 연관성\n\n" +
                "【감정이 행동에 미치는 영향】\n" +
                "- 현재 감정이 판단과 행동에 미치는 영향\n" +
                "- 관계에 미치는 파급효과\n\n" +
                "【건강한 감정 관리법】\n" +
                "- 상황에 맞는 구체적인 감정 표현 방법\n" +
                "- 감정 조절과 회복을 위한 실용적 방안",
                description
            );
            
            String gmsResponse = gmsAiClient.ask(emotionPrompt, "gpt-4o-mini");
            
            if (gmsResponse.startsWith("GMS 호출 실패:")) {
                return generateBasicEmotionAnalysis(description);
            }
            
            return gmsResponse;
            
        } catch (Exception e) {
            log.warn("AI 감정 분석 실패, 기본 분석 제공: {}", e.getMessage());
            return generateBasicEmotionAnalysis(description);
        }
    }
    
    private String generateBasicEmotionAnalysis(String description) {
        StringBuilder analysis = new StringBuilder();
        String lowerDesc = description.toLowerCase();
        
        analysis.append("【감정 상태 분석】\n");
        
        if (lowerDesc.contains("화") || lowerDesc.contains("분노") || lowerDesc.contains("짜증")) {
            analysis.append("현재 주된 감정은 분노와 좌절감으로, 이는 기대가 충족되지 않았거나 존중받지 못했다는 느낌에서 비롯됩니다.");
        } else if (lowerDesc.contains("슬프") || lowerDesc.contains("우울") || lowerDesc.contains("실망")) {
            analysis.append("슬픔과 실망감이 주된 감정으로, 관계에 대한 기대와 현실 사이의 간극에서 오는 감정적 상처가 있습니다.");
        } else if (lowerDesc.contains("불안") || lowerDesc.contains("걱정") || lowerDesc.contains("두려")) {
            analysis.append("불안과 걱정이 주된 감정으로, 상황에 대한 통제력 부족과 미래에 대한 불확실성이 원인입니다.");
        } else {
            analysis.append("복합적인 감정 상태로, 여러 감정이 혼재되어 있어 명확한 감정 인식과 정리가 필요합니다.");
        }
        
        return analysis.toString();
    }
    
    private String analyzeConflictFromText(String description, ConflictType conflictType) {
        try {
            String conflictAnalysisPrompt = String.format(
                "당신은 갈등 분석 전문가입니다. 다음 %s 갈등 상황을 다차원적으로 분석해주세요.\n\n" +
                "갈등 내용: %s\n\n" +
                "다음 형식으로 심층적인 갈등 분석을 제공해주세요:\n" +
                "【원인 층위 분석】\n" +
                "- 표면적/즉각적 원인 (눈에 보이는 직접적 원인)\n" +
                "- 구조적/시스템적 원인 (환경, 제도, 규칙의 문제)\n" +
                "- 심층적/근본적 원인 (가치관, 신념, 과거 경험의 충돌)\n\n" +
                "【소통 패턴 분석】\n" +
                "- 현재 소통 방식의 문제점\n" +
                "- 서로 다른 소통 스타일과 기대치\n" +
                "- 메시지 전달과 수신 과정의 왜곡\n\n" +
                "【권력과 역학관계】\n" +
                "- 관계에서의 힘의 균형\n" +
                "- 의사결정 과정에서의 영향력\n" +
                "- 상호의존성과 자율성의 균형\n\n" +
                "【환경적/상황적 요인】\n" +
                "- 외부 스트레스와 압박 요인\n" +
                "- 시간적, 공간적 제약 조건\n" +
                "- 사회문화적 배경과 기대\n\n" +
                "【갈등 유지 요인】\n" +
                "- 갈등이 지속되게 하는 패턴\n" +
                "- 변화를 어렵게 하는 장벽\n" +
                "- 악순환의 고리와 그 원동력",
                getKoreanConflictType(conflictType), description
            );
            
            String gmsResponse = gmsAiClient.ask(conflictAnalysisPrompt, "gpt-4o-mini");
            
            if (gmsResponse.startsWith("GMS 호출 실패:")) {
                return generateBasicConflictAnalysis(description, conflictType);
            }
            
            return gmsResponse;
            
        } catch (Exception e) {
            log.warn("AI 갈등 분석 실패, 기본 분석 제공: {}", e.getMessage());
            return generateBasicConflictAnalysis(description, conflictType);
        }
    }
    
    private String generateBasicConflictAnalysis(String description, ConflictType conflictType) {
        StringBuilder analysis = new StringBuilder();
        String lowerDesc = description.toLowerCase();
        
        analysis.append("【갈등 원인 분석】\n");
        
        if (lowerDesc.contains("늦게") || lowerDesc.contains("시간")) {
            analysis.append("시간 약속과 관련된 갈등으로, 서로의 시간 관리 방식과 약속에 대한 중요도 인식에 차이가 있습니다.");
        } else if (lowerDesc.contains("말") || lowerDesc.contains("대화")) {
            analysis.append("소통 방식의 차이로 인한 갈등으로, 서로의 표현 스타일과 이해 방식에 근본적 차이가 있습니다.");
        } else {
            analysis.append(String.format("%s에서 발생한 갈등으로, 서로의 기대와 현실 사이의 괴리가 주요 원인으로 보입니다.", 
                getKoreanConflictType(conflictType)));
        }
        
        return analysis.toString();
    }
    
    private List<String> generatePracticalActions(String description, ConflictType conflictType) {
        try {
            String practicalActionsPrompt = String.format(
                "당신은 갈등 해결 전문 코치입니다. 다음 %s 갈등 상황에 대해 구체적이고 실행 가능한 해결 행동 계획을 단계별로 제시해주세요.\n\n" +
                "갈등 내용: %s\n\n" +
                "다음 형식으로 실용적인 행동 방안을 제시해주세요 (각 항목은 구체적이고 실행 가능해야 함):\n" +
                "【즉시 실행 가능한 응급처치 (오늘~내일)】\n" +
                "【단기 해결책 (1-2주 내)】\n" +
                "【중기 관계 회복 전략 (1-3개월)】\n" +
                "【장기 예방 및 성장 방안 (3개월 이상)】\n" +
                "【실패 시 대안 계획】\n\n" +
                "각 단계별로 2-3개의 구체적이고 실현 가능한 행동을 제시하되, 상황의 특성을 반영한 맞춤형 조언이어야 합니다.",
                getKoreanConflictType(conflictType), description
            );
            
            String gmsResponse = gmsAiClient.ask(practicalActionsPrompt, "gpt-4o-mini");
            
            if (gmsResponse.startsWith("GMS 호출 실패:")) {
                return generateBasicPracticalActions(description, conflictType);
            }
            
            // AI 응답을 리스트로 파싱
            return parseActionsFromAiResponse(gmsResponse);
            
        } catch (Exception e) {
            log.warn("AI 실용적 행동 생성 실패, 기본 행동 제공: {}", e.getMessage());
            return generateBasicPracticalActions(description, conflictType);
        }
    }
    
    private List<String> generateBasicPracticalActions(String description, ConflictType conflictType) {
        List<String> actions = new ArrayList<>();
        
        // 즉시 실행 가능한 행동
        actions.add("감정을 진정시키고 상황을 객관적으로 정리하기");
        
        // 갈등 유형별 맞춤 행동 제안
        switch (conflictType) {
            case WORK:
                actions.add("동료나 상사와의 개별 대화 시간 요청하기");
                actions.add("업무 프로세스 개선을 위한 건설적 제안하기");
                break;
            case FAMILY:
                actions.add("가족 구성원과 차분한 개별 대화 시간 갖기");
                actions.add("서로의 입장을 이해하려는 열린 마음가짐 갖기");
                break;
            case COUPLE:
                actions.add("'I 메시지'로 자신의 감정을 솔직하게 표현하기");
                actions.add("상대방의 말을 끝까지 들어보고 공감하려 노력하기");
                break;
            case FRIEND:
                actions.add("오해 해소를 위한 솔직한 대화 시도하기");
                actions.add("서로의 경계선을 존중하는 새로운 약속 만들기");
                break;
            default:
                actions.add("상대방과 차분한 환경에서 대화할 기회 만들기");
                actions.add("필요시 신뢰할 만한 제3자의 조언 구하기");
        }
        
        // 공통 행동 추가
        actions.add("갈등 해결 후 관계 개선을 위한 구체적 계획 세우기");
        
        return actions;
    }
    
    private List<String> parseActionsFromAiResponse(String response) {
        List<String> actions = new ArrayList<>();
        String[] lines = response.split("\n");
        
        for (String line : lines) {
            line = line.trim();
            if (!line.isEmpty() && !line.startsWith("【") && !line.startsWith("===")) {
                // 불필요한 기호 제거하고 의미 있는 내용만 추출
                line = line.replaceAll("^[\\d\\-\\*•]+\\s*", "").trim();
                if (line.length() > 10) { // 너무 짧은 텍스트 제외
                    actions.add(line);
                }
            }
        }
        
        return actions.isEmpty() ? generateBasicPracticalActions("", ConflictType.COUPLE) : actions;
    }
    
    private Map<String, List<String>> parseActionsIntoPhases(String solutions) {
        Map<String, List<String>> phasedActions = new HashMap<>();
        List<String> immediate = new ArrayList<>();
        List<String> shortTerm = new ArrayList<>();
        List<String> midTerm = new ArrayList<>();
        List<String> longTerm = new ArrayList<>();
        List<String> alternative = new ArrayList<>();
        
        if (solutions.isEmpty()) {
            immediate.add("감정을 진정시키고 상황을 객관적으로 정리하기");
            shortTerm.add("상대방과 차분한 대화 시도하기");
            midTerm.add("관계 회복을 위한 지속적인 노력하기");
            longTerm.add("갈등 예방을 위한 소통 패턴 개선하기");
            alternative.add("전문가의 도움을 받는 것을 고려하기");
        } else {
            String[] lines = solutions.split("\n");
            String currentPhase = "immediate";
            
            for (String line : lines) {
                line = line.trim();
                
                // 단계 구분 키워드 확인
                if (line.contains("즉시") || line.contains("응급") || line.contains("오늘") || line.contains("내일")) {
                    currentPhase = "immediate";
                } else if (line.contains("단기") || line.contains("1-2주") || line.contains("일주일")) {
                    currentPhase = "shortTerm";
                } else if (line.contains("중기") || line.contains("1-3개월") || line.contains("한달")) {
                    currentPhase = "midTerm";
                } else if (line.contains("장기") || line.contains("3개월") || line.contains("예방")) {
                    currentPhase = "longTerm";
                } else if (line.contains("실패") || line.contains("대안") || line.contains("Plan B")) {
                    currentPhase = "alternative";
                }
                
                // 실제 액션 아이템 추가
                if (!line.isEmpty() && !line.startsWith("【") && !line.startsWith("===") && !line.startsWith("#")) {
                    line = line.replaceAll("^[\\d\\-\\*•]+\\s*", "").trim();
                    if (line.length() > 10) {
                        switch (currentPhase) {
                            case "immediate":
                                if (immediate.size() < 4) immediate.add(line);
                                break;
                            case "shortTerm":
                                if (shortTerm.size() < 4) shortTerm.add(line);
                                break;
                            case "midTerm":
                                if (midTerm.size() < 4) midTerm.add(line);
                                break;
                            case "longTerm":
                                if (longTerm.size() < 4) longTerm.add(line);
                                break;
                            case "alternative":
                                if (alternative.size() < 4) alternative.add(line);
                                break;
                        }
                    }
                }
            }
            
            // 비어있는 단계 기본값 채우기
            if (immediate.isEmpty()) immediate.add("24시간 쿨링 타임을 가진 후 상황 정리하기");
            if (shortTerm.isEmpty()) shortTerm.add("상대방과 만나 대화할 시간 정하기");
            if (midTerm.isEmpty()) midTerm.add("신뢰 회복을 위한 꾸준한 노력하기");
            if (longTerm.isEmpty()) longTerm.add("건강한 관계 패턴 만들어가기");
            if (alternative.isEmpty()) alternative.add("관계 재정립이나 전문가 상담 고려하기");
        }
        
        phasedActions.put("immediate", immediate);
        phasedActions.put("shortTerm", shortTerm);
        phasedActions.put("midTerm", midTerm);
        phasedActions.put("longTerm", longTerm);
        phasedActions.put("alternative", alternative);
        
        return phasedActions;
    }
    
    private List<String> parseActionsFromSolutions(String solutions) {
        Map<String, List<String>> phasedActions = parseActionsIntoPhases(solutions);
        List<String> allActions = new ArrayList<>();
        
        // 모든 단계의 액션을 하나의 리스트로 합치기
        phasedActions.values().forEach(allActions::addAll);
        
        return allActions.isEmpty() ? List.of("상황에 맞는 맞춤형 해결 방안을 제시해드립니다.") : allActions;
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
        
        // 갈등 유형별 맞춤형 접두사 (더 간결하게)
        String typePrefix = getShortTypePrefix(conflictType);
        summary.append(typePrefix);
        
        // 키워드 분석 (더 간결하게, HTML 태그 적용)
        if (description.contains("화가") || description.contains("분노") || description.contains("짜증")) {
            summary.append("<strong>감정적 갈등</strong>이 원인으로, ");
        } else if (description.contains("오해") || description.contains("misunderstand")) {
            summary.append("<strong>소통 문제</strong>가 핵심으로, ");
        } else if (description.contains("자주") || description.contains("반복") || description.contains("계속")) {
            summary.append("<strong>반복 패턴</strong>으로, ");
        } else {
            summary.append("<strong>상황적 갈등</strong>으로, ");
        }
        
        summary.append("<strong>대화</strong>를 통한 해결 필요");
        
        // 100자 제한
        String result = summary.toString();
        if (result.length() > 100) {
            result = result.substring(0, 100) + "...";
        }
        
        return result;
    }
    
    private String getShortTypePrefix(ConflictType conflictType) {
        switch (conflictType) {
            case WORK: return "<strong>직장</strong> 갈등: ";
            case FAMILY: return "<strong>가족</strong> 갈등: ";
            case FRIEND: return "<strong>친구</strong> 갈등: ";
            case COUPLE: return "<strong>연인</strong> 갈등: ";
            case NEIGHBOR: return "<strong>이웃</strong> 갈등: ";
            case FINANCIAL: return "<strong>금전</strong> 갈등: ";
            case ONLINE: return "<strong>온라인</strong> 갈등: ";
            default: return "<strong>일반</strong> 갈등: ";
        }
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
    
    /**
     * 내 입장 분석 생성
     */
    private String generateMyPositionAnalysis(String description, ConflictType conflictType) {
        try {
            String myPositionPrompt = String.format(
                "당신은 심리 분석 전문가입니다. 다음 %s 갈등 상황에서 당사자(갈등을 서술한 사람)의 심리 상태와 입장을 깊이 있게 분석해주세요.\n\n" +
                "갈등 내용: %s\n\n" +
                "다음 형식으로 당사자의 심리적 입장을 분석해주세요:\n" +
                "【현재 감정적 니즈와 욕구】\n" +
                "- 가장 충족되지 않은 감정적 필요\n" +
                "- 상대방으로부터 원하는 것의 본질\n" +
                "- 깊이 숨겨진 욕구와 바람\n\n" +
                "【갈등에서 원하는 진짜 결과】\n" +
                "- 표면적으로 요구하는 것 vs 진정 원하는 것\n" +
                "- 관계에서 추구하는 핵심 가치\n" +
                "- 이상적인 해결 후의 관계 모습\n\n" +
                "【무의식적 행동 패턴과 방어기제】\n" +
                "- 스트레스 상황에서 나타나는 대응 패턴\n" +
                "- 상처받지 않기 위한 방어 전략\n" +
                "- 과거 경험이 현재에 미치는 영향\n\n" +
                "【성장과 변화가 필요한 부분】\n" +
                "- 관계 개선을 위해 발전시켜야 할 능력\n" +
                "- 새로운 관점이나 행동 방식의 필요성\n" +
                "- 자기 인식과 성찰이 필요한 영역",
                getKoreanConflictType(conflictType), description
            );
            
            String gmsResponse = gmsAiClient.ask(myPositionPrompt, "gpt-4o-mini");
            
            if (gmsResponse.startsWith("GMS 호출 실패:")) {
                return generateBasicMyPositionAnalysis(description, conflictType);
            }
            
            return gmsResponse;
            
        } catch (Exception e) {
            log.warn("AI 내 입장 분석 실패, 기본 분석 제공: {}", e.getMessage());
            return generateBasicMyPositionAnalysis(description, conflictType);
        }
    }
    
    private String generateBasicMyPositionAnalysis(String description, ConflictType conflictType) {
        StringBuilder analysis = new StringBuilder();
        
        analysis.append("【현재 심리 상태】\n");
        
        switch (conflictType) {
            case COUPLE:
                analysis.append("관계에서 자신의 감정과 필요가 충분히 이해받지 못한다고 느끼며, 상대방과의 더 깊은 소통과 이해를 원하고 있습니다.");
                break;
            case WORK:
                analysis.append("업무 환경에서 자신의 기여와 노력이 적절히 인정받지 못한다고 느끼며, 보다 공정하고 협력적인 관계를 원하고 있습니다.");
                break;
            case FAMILY:
                analysis.append("가족 구성원으로서 자신의 입장과 감정이 존중받기를 원하며, 조화로운 가족 관계를 위한 상호 이해를 기대하고 있습니다.");
                break;
            case FRIEND:
                analysis.append("친구 관계에서 상호 존중과 이해를 바탕으로 한 건강한 관계를 원하며, 현재 상황에서 자신의 입장이 고려되지 않는다고 느끼고 있습니다.");
                break;
            default:
                analysis.append("현재 상황에서 자신의 입장과 감정이 충분히 이해받지 못한다고 느끼며, 상호 존중을 바탕으로 한 해결책을 찾고 있습니다.");
        }
        
        return analysis.toString();
    }
    
    /**
     * 상대방 입장 분석 생성
     */
    private String generatePartnerPositionAnalysis(String description, ConflictType conflictType) {
        try {
            String partnerPositionPrompt = String.format(
                "당신은 관계 심리학 전문가입니다. 다음 %s 갈등 상황에서 상대방의 가능한 심리 상태와 입장을 공감적이고 객관적으로 추론해주세요.\n\n" +
                "갈등 내용: %s\n\n" +
                "다음 형식으로 상대방의 관점을 깊이 있게 분석해주세요:\n" +
                "【상대방의 가능한 감정 상태】\n" +
                "- 표면적으로 보이는 감정 vs 내면의 진짜 감정\n" +
                "- 상대방이 느낄 수 있는 압박감이나 스트레스\n" +
                "- 방어적 행동 뒤에 숨은 취약함이나 두려움\n\n" +
                "【행동의 숨겨진 동기와 필요】\n" +
                "- 문제 행동의 배경이 되는 미충족 욕구\n" +
                "- 상대방 나름의 합리화나 정당화 논리\n" +
                "- 과거 경험이나 학습된 패턴의 영향\n\n" +
                "【상대방이 느끼는 딜레마와 제약】\n" +
                "- 원하지만 표현하지 못하는 것들\n" +
                "- 상황적, 환경적 제약 조건\n" +
                "- 변화하고 싶지만 어려운 이유들\n\n" +
                "【관계에서 상대방이 추구하는 가치】\n" +
                "- 이 관계에서 중요하게 여기는 것들\n" +
                "- 자신만의 관계 유지 방식이나 스타일\n" +
                "- 갈등 해결에 대한 상대방의 접근법",
                getKoreanConflictType(conflictType), description
            );
            
            String gmsResponse = gmsAiClient.ask(partnerPositionPrompt, "gpt-4o-mini");
            
            if (gmsResponse.startsWith("GMS 호출 실패:")) {
                return generateBasicPartnerPositionAnalysis(description, conflictType);
            }
            
            return gmsResponse;
            
        } catch (Exception e) {
            log.warn("AI 상대방 입장 분석 실패, 기본 분석 제공: {}", e.getMessage());
            return generateBasicPartnerPositionAnalysis(description, conflictType);
        }
    }
    
    private String generateBasicPartnerPositionAnalysis(String description, ConflictType conflictType) {
        StringBuilder analysis = new StringBuilder();
        
        analysis.append("【상대방 관점 추론】\n");
        
        switch (conflictType) {
            case COUPLE:
                analysis.append("상대방은 자신만의 상황과 이유가 있어 그런 행동을 했을 가능성이 높으며, 상황에 대한 인식이나 우선순위에서 차이가 있을 수 있습니다.");
                break;
            case WORK:
                analysis.append("상대방은 자신만의 업무 방식이나 우선순위를 가지고 있으며, 상황에 대한 이해나 접근 방식에서 차이가 있을 수 있습니다.");
                break;
            case FAMILY:
                analysis.append("상대방은 자신의 가치관이나 상황적 제약으로 인해 다른 선택을 하고 있으며, 가족 구성원으로서 나름의 이유와 입장을 가지고 있을 것입니다.");
                break;
            case FRIEND:
                analysis.append("상대방은 자신의 상황이나 관점에서 다른 판단을 내렸을 수 있으며, 친구로서의 선의는 있지만 표현 방식이나 인식에서 차이가 있을 수 있습니다.");
                break;
            default:
                analysis.append("상대방은 자신만의 상황과 이유가 있어 그런 행동을 했을 가능성이 높으며, 당사자의 감정이나 입장을 완전히 이해하지 못했을 수 있습니다.");
        }
        
        return analysis.toString();
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