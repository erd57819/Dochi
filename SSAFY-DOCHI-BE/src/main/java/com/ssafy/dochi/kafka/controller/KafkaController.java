package com.ssafy.dochi.kafka.controller;

import com.ssafy.dochi.kafka.dto.RoomMetricsDto;
import com.ssafy.dochi.kafka.dto.UserActivityDto;
import com.ssafy.dochi.kafka.service.KafkaProducerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Kafka 확장성 데모용 컨트롤러
 * 기존 VideoCall 기능과 완전히 분리됨
 * KAFKA_ENABLED=false일 때는 비활성화
 */
@Slf4j
@RestController
@RequestMapping("/api/kafka")
@ConditionalOnProperty(name = "kafka.enabled", havingValue = "true", matchIfMissing = false)
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://i13c209.p.ssafy.io"})
public class KafkaController {

    private final KafkaProducerService kafkaProducerService;

    @Autowired
    public KafkaController(KafkaProducerService kafkaProducerService) {
        this.kafkaProducerService = kafkaProducerService;
        log.info("[Kafka Controller] 초기화 완료 - 확장성 데모 엔드포인트 활성화");
    }

    /**
     * 방 메트릭 전송 엔드포인트
     * VideoCallRoom에서 주기적으로 호출됨 (기존 기능에 영향 없음)
     */
    @PostMapping("/room-metrics")
    public ResponseEntity<Map<String, Object>> sendRoomMetrics(@RequestBody RoomMetricsDto dto) {
        try {
            // timestamp 자동 설정
            if (dto.getTimestamp() == null) {
                dto.setTimestamp(LocalDateTime.now().toString());
            }
            
            kafkaProducerService.sendRoomMetrics(dto);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "방 메트릭이 Kafka로 전송되었습니다");
            response.put("roomId", dto.getRoomId());
            response.put("participants", dto.getParticipantCount());
            response.put("timestamp", dto.getTimestamp());
            response.put("partition", "auto-assigned"); // 파티션은 자동 할당됨
            
            log.debug("[API] 방 메트릭 접수: {} ({}명)", dto.getRoomId(), dto.getParticipantCount());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("[API] 방 메트릭 전송 오류: {}", e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "메트릭 전송 실패: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * 사용자 활동 전송 엔드포인트
     */
    @PostMapping("/user-activity")
    public ResponseEntity<Map<String, Object>> sendUserActivity(@RequestBody UserActivityDto dto) {
        try {
            if (dto.getTimestamp() == null) {
                dto.setTimestamp(LocalDateTime.now().toString());
            }
            
            kafkaProducerService.sendUserActivity(dto);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "사용자 활동이 Kafka로 전송되었습니다");
            response.put("activityType", dto.getActivityType());
            response.put("userId", dto.getUserId());
            response.put("roomId", dto.getRoomId());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("[API] 사용자 활동 전송 오류: {}", e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "활동 전송 실패: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * 시뮬레이션 전용: 배치 메트릭 생성
     * 확장성 테스트용 대량 데이터 생성
     */
    @PostMapping("/simulate/batch-metrics")
    public ResponseEntity<Map<String, Object>> simulateBatchMetrics(
            @RequestParam(defaultValue = "DEMO") String roomPrefix,
            @RequestParam(defaultValue = "100") int count) {
        
        try {
            // 안전장치: 최대 1000개까지만
            int safeCount = Math.min(count, 1000);
            
            log.info("[시뮬레이션] 배치 메트릭 생성 시작: {}개 (접두사: {})", safeCount, roomPrefix);
            
            // 별도 스레드에서 실행하여 API 응답 지연 방지
            new Thread(() -> kafkaProducerService.sendBatchMetrics(roomPrefix, safeCount)).start();
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "started");
            response.put("message", safeCount + "개 배치 메트릭 생성을 시작했습니다");
            response.put("roomPrefix", roomPrefix);
            response.put("count", safeCount);
            response.put("note", "백그라운드에서 실행 중입니다");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("[시뮬레이션] 배치 생성 오류: {}", e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "시뮬레이션 실패: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * Kafka 상태 확인 엔드포인트
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "healthy");
        health.put("service", "kafka-expansion");
        health.put("timestamp", LocalDateTime.now().toString());
        health.put("features", new String[]{"room-metrics", "user-activity", "batch-simulation"});
        health.put("note", "기존 STT 서비스와 완전 분리됨");
        
        return ResponseEntity.ok(health);
    }

    /**
     * 파티션 분산 정보 조회 (시뮬레이션 결과 확인용)
     */
    @GetMapping("/partition-info/{roomId}")
    public ResponseEntity<Map<String, Object>> getPartitionInfo(@PathVariable String roomId) {
        Map<String, Object> info = new HashMap<>();
        info.put("roomId", roomId);
        info.put("partitionKey", roomId);
        info.put("estimatedPartition", Math.abs(roomId.hashCode()) % 3); // 3개 파티션 가정
        info.put("note", "실제 파티션은 Kafka가 동적 할당합니다");
        
        return ResponseEntity.ok(info);
    }
}