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

    @Value("${gms.api.url}")
    private String apiUrl;

    public String ask(String prompt, String model) {

        // 헤더는 인터셉터에서 자동으로 붙이므로 생략 가능
        HttpHeaders headers = new HttpHeaders();

        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", "You are a helpful assistant."),
                Map.of("role", "user", "content", prompt)
        );

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", messages);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
            return (String) ((Map<String, Object>) choices.get(0).get("message")).get("content");
        } catch (Exception e) {
            System.err.println("GMS 호출 실패");
            System.err.println("Request URL: " + apiUrl);
            System.err.println("Body: " + body);
            e.printStackTrace();
            return "GMS 호출 실패: " + e.getMessage();
        }
    }
}
