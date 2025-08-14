package com.ssafy.dochi.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GmsAiClient {

    private final RestTemplate restTemplate;

    @Value("${gms.api.openai.url:https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions}")
    private String openaiApiUrl;
    
    @Value("${gms.api.anthropic.url:https://gms.ssafy.io/gmsapi/api.anthropic.com/v1/messages}")
    private String anthropicApiUrl;

    public String ask(String prompt, String model) {

        // 헤더는 인터셉터에서 자동으로 붙이므로 생략 가능
        HttpHeaders headers = new HttpHeaders();

        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", "You are a helpful assistant."),
                Map.of("role", "user", "content", prompt)
        );

        // 먼저 요청한 모델로 시도
        String result = tryWithModel(model, messages, headers);
        if (result != null) {
            return result;
        }
        
        // 실패하면 fallback 모델(gpt-4o-mini)로 재시도 (단, 이미 gpt-4o-mini가 아닌 경우만)
        if (!"gpt-4o-mini".equals(model)) {
            System.err.println("모델 " + model + " 실패, gpt-4o-mini로 재시도");
            result = tryWithModel("gpt-4o-mini", messages, headers);
            if (result != null) {
                return result;
            }
        }
        
        return "모든 모델 호출 실패";
    }
    
    private String tryWithModel(String model, List<Map<String, String>> messages, HttpHeaders headers) {
        if (model.startsWith("claude")) {
            return callAnthropicAPI(model, messages);
        } else {
            return callOpenAIAPI(model, messages);
        }
    }
    
    private String callOpenAIAPI(String model, List<Map<String, String>> messages) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // Authorization 헤더는 인터셉터에서 추가됨
        
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", messages);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(openaiApiUrl, request, Map.class);
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
            return (String) ((Map<String, Object>) choices.get(0).get("message")).get("content");
        } catch (Exception e) {
            System.err.println("OpenAI 모델 " + model + " 호출 실패: " + e.getMessage());
            return null;
        }
    }
    
    private String callAnthropicAPI(String model, List<Map<String, String>> messages) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("anthropic-version", "2023-06-01");
        // x-api-key 헤더는 인터셉터에서 추가됨
        
        // Anthropic API는 system 메시지와 user 메시지를 분리
        List<Map<String, String>> anthropicMessages = messages.stream()
                .filter(msg -> "user".equals(msg.get("role")))
                .toList();
        
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("max_tokens", 1024);
        body.put("messages", anthropicMessages);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(anthropicApiUrl, request, Map.class);
            List<Map<String, Object>> content = (List<Map<String, Object>>) response.getBody().get("content");
            return (String) content.get(0).get("text");
        } catch (Exception e) {
            System.err.println("Anthropic 모델 " + model + " 호출 실패: " + e.getMessage());
            return null;
        }
    }
}
