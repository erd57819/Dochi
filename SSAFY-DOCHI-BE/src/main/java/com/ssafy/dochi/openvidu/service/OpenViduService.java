package com.ssafy.dochi.openvidu.service;

import com.ssafy.dochi.openvidu.exception.OpenViduException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OpenViduService {

    @Value("${openvidu.url:http://localhost:4443}")
    private String openViduUrl;
    
    @Value("${openvidu.secret:MY_SECRET}")
    private String openViduSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    // OpenVidu 토큰 생성
    public String createToken(String sessionId, String identity, List<String> permissions) {
        try {
            // 1. 세션 생성 (이미 존재하면 무시됨)
            createSession(sessionId);
            
            // 2. 토큰 생성
            return generateToken(sessionId, identity);
        } catch (Exception e) {
            throw new OpenViduException("OpenVidu 토큰 생성 실패", e);
        }
    }

    private void createSession(String sessionId) {
        String url = openViduUrl + "/openvidu/api/sessions";
        
        HttpHeaders headers = createAuthHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> body = new HashMap<>();
        body.put("customSessionId", sessionId);
        body.put("recordingMode", "MANUAL");
        body.put("defaultRecordingProperties", Map.of(
            "outputMode", "COMPOSED",
            "hasAudio", true,
            "hasVideo", true
        ));
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        
        try {
            restTemplate.postForEntity(url, entity, String.class);
        } catch (Exception e) {
            // 세션이 이미 존재하는 경우 무시
            if (!e.getMessage().contains("409")) {
                throw e;
            }
        }
    }

    private String generateToken(String sessionId, String identity) {
        String url = openViduUrl + "/openvidu/api/sessions/" + sessionId + "/connection";
        
        HttpHeaders headers = createAuthHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> body = new HashMap<>();
        body.put("type", "WEBRTC");
        body.put("data", identity);
        body.put("record", false);
        body.put("role", "PUBLISHER");
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
        Map<String, Object> responseBody = response.getBody();
        
        if (responseBody != null && responseBody.containsKey("token")) {
            return (String) responseBody.get("token");
        }
        
        throw new OpenViduException("토큰 생성 응답에서 token을 찾을 수 없음");
    }

    private HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        String auth = "OPENVIDUAPP:" + openViduSecret;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
        headers.set("Authorization", "Basic " + encodedAuth);
        return headers;
    }
}
