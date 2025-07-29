package com.ssafy.dochi.openvidu.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class OpenViduService {

    @Value("${openvidu.url}")
    private String openviduUrl;

    @Value("${openvidu.secret}")
    private String secret;

    private final RestTemplate restTemplate = new RestTemplate();

    // 세션 생성
    public String createSession() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth("OPENVIDUAPP", secret);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>("{}", headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                openviduUrl + "/openvidu/api/sessions",
                entity,
                Map.class
        );

        return (String) response.getBody().get("id");
    }

    // 세션 참가 (Connection 생성)
    public String createConnection(String sessionId, Long userId, String nickname) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth("OPENVIDUAPP", secret);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 화자 구분을 위한 userId, nickname 전달
        String body = String.format(
                "{\"role\":\"PUBLISHER\", \"data\":\"userId:%d,name:%s\"}",
                userId, nickname
        );

        HttpEntity<String> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                openviduUrl + "/openvidu/api/sessions/" + sessionId + "/connection",
                entity,
                Map.class
        );

        return (String) response.getBody().get("token");
    }
}
