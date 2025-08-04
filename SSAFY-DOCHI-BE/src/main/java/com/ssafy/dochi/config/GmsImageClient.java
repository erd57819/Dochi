package com.ssafy.dochi.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GmsImageClient {

    private final RestTemplate restTemplate;

    @Value("${gms.image.api.url}")
    private String imageApiUrl;

    public String generateImage(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // Authorization 헤더는 인터셉터에서 자동 삽입된다고 가정

        Map<String, Object> body = new HashMap<>();
        body.put("model", "dall-e-3");
        body.put("prompt", prompt);
        body.put("size", "1024x1024");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(imageApiUrl, request, Map.class);

            List<Map<String, Object>> dataList = (List<Map<String, Object>>) response.getBody().get("data");
            if (dataList == null || dataList.isEmpty()) {
                throw new RuntimeException("이미지 생성 실패: 응답에 이미지가 없습니다.");
            }

            return (String) dataList.get(0).get("url");

        } catch (Exception e) {
            System.err.println("GMS 이미지 생성 실패");
            System.err.println("Request URL: " + imageApiUrl);
            System.err.println("Body: " + body);
            e.printStackTrace();
            return "이미지 생성 실패: " + e.getMessage();
        }
    }
}
