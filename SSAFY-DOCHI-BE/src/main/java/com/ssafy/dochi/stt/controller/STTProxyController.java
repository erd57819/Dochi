package com.ssafy.dochi.stt.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.core.io.ByteArrayResource;

@RestController
@RequestMapping("/api/stt")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8090"})
public class STTProxyController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String AI_SERVICE_URL = "http://ai-service:8002"; // 도커 내부 통신

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                AI_SERVICE_URL + "/stt/health", 
                String.class
            );
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("{\"error\": \"AI 서비스에 연결할 수 없습니다\"}");
        }
    }

    @PostMapping("/transcribe")
    public ResponseEntity<?> transcribe(
            @RequestParam("audio_file") MultipartFile audioFile,
            @RequestParam(value = "model", defaultValue = "whisper-1") String model
    ) {
        try {
            // AI 서비스로 프록시
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("audio_file", new ByteArrayResource(audioFile.getBytes()) {
                @Override
                public String getFilename() {
                    return audioFile.getOriginalFilename();
                }
            });
            body.add("model", model);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                AI_SERVICE_URL + "/stt/transcribe",
                requestEntity,
                String.class
            );

            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("{\"error\": \"STT 처리 중 오류가 발생했습니다: " + e.getMessage() + "\"}");
        }
    }

    @PostMapping("/transcribe-and-analyze")
    public ResponseEntity<?> transcribeAndAnalyze(
            @RequestParam("audio_file") MultipartFile audioFile,
            @RequestParam(value = "model", defaultValue = "whisper-1") String model,
            @RequestParam(value = "analyze_emotion", defaultValue = "true") String analyzeEmotion,
            @RequestParam(value = "analyze_conflict", defaultValue = "true") String analyzeConflict
    ) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("audio_file", new ByteArrayResource(audioFile.getBytes()) {
                @Override
                public String getFilename() {
                    return audioFile.getOriginalFilename();
                }
            });
            body.add("model", model);
            body.add("analyze_emotion", analyzeEmotion);
            body.add("analyze_conflict", analyzeConflict);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                AI_SERVICE_URL + "/stt/transcribe-and-analyze",
                requestEntity,
                String.class
            );

            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("{\"error\": \"STT 분석 처리 중 오류가 발생했습니다: " + e.getMessage() + "\"}");
        }
    }
}