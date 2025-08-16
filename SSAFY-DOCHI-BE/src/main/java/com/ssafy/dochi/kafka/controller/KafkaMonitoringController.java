package com.ssafy.dochi.kafka.controller;

import com.ssafy.dochi.common.template.ApiResponse;
import com.ssafy.dochi.common.template.ApiResponseGenerator;
import com.ssafy.dochi.kafka.consumer.VideoCallEventConsumer;
import com.ssafy.dochi.kafka.service.KafkaMetricsService;
import com.ssafy.dochi.kafka.simulator.LoadTestSimulator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Slf4j
@RestController
@RequestMapping("/api/kafka")
@RequiredArgsConstructor
@Tag(name = "Kafka Monitoring", description = "카프카 모니터링 및 부하 테스트 API")
@Profile({"kafka", "dev"}) // kafka 프로파일이나 dev 환경에서만 활성화
@ConditionalOnProperty(name = "kafka.enabled", havingValue = "true", matchIfMissing = false)
public class KafkaMonitoringController {
    
    private final KafkaMetricsService metricsService;
    private final LoadTestSimulator loadTestSimulator;
    private final VideoCallEventConsumer eventConsumer;
    
    /**
     * 시스템 메트릭 조회
     */
    @GetMapping("/metrics")
    @Operation(summary = "시스템 메트릭 조회", description = "카프카 시스템 전체 메트릭을 조회합니다")
    public ApiResponse<ApiResponse.SuccessCustomBody<KafkaMetricsService.SystemMetrics>> getSystemMetrics() {
        KafkaMetricsService.SystemMetrics metrics = metricsService.getSystemMetrics();
        return ApiResponseGenerator.success(metrics, HttpStatus.OK);
    }
    
    /**
     * 파티션별 처리 통계
     */
    @GetMapping("/partitions/stats")
    @Operation(summary = "파티션별 통계", description = "각 파티션의 처리량 통계를 조회합니다")
    public ApiResponse<ApiResponse.SuccessCustomBody<Map<String, Object>>> getPartitionStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("partitionProcessingCount", eventConsumer.getPartitionStats());
        stats.put("systemMetrics", metricsService.getSystemMetrics().getPartitionLoadDistribution());
        
        return ApiResponseGenerator.success(stats, HttpStatus.OK);
    }
    
    /**
     * 대규모 부하 테스트 시작
     */
    @PostMapping("/test/massive-load")
    @Operation(summary = "대규모 부하 테스트", description = "지정된 수의 방을 동시에 생성하여 부하 테스트를 수행합니다")
    public ApiResponse<ApiResponse.SuccessCustomBody<Map<String, Object>>> startMassiveLoadTest(
            @RequestParam(defaultValue = "1000") int roomCount,
            @RequestParam(defaultValue = "5") int durationMinutes) {
        
        log.info("대규모 부하 테스트 요청 - 방 수: {}, 지속시간: {}분", roomCount, durationMinutes);
        
        CompletableFuture<LoadTestSimulator.SimulationResult> future = 
            loadTestSimulator.startMassiveLoadTest(roomCount, durationMinutes);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "STARTED");
        response.put("targetRoomCount", roomCount);
        response.put("durationMinutes", durationMinutes);
        response.put("message", "부하 테스트가 시작되었습니다. /api/kafka/test/status 에서 진행상황을 확인하세요.");
        
        return ApiResponseGenerator.success(response, HttpStatus.OK);
    }
    
    /**
     * 점진적 부하 테스트
     */
    @PostMapping("/test/gradual-load")
    @Operation(summary = "점진적 부하 테스트", description = "점진적으로 부하를 증가시키며 테스트합니다")
    public ApiResponse<ApiResponse.SuccessCustomBody<Map<String, Object>>> startGradualLoadTest(
            @RequestParam(defaultValue = "500") int maxRooms,
            @RequestParam(defaultValue = "50") int incrementStep,
            @RequestParam(defaultValue = "10") int intervalSeconds) {
        
        loadTestSimulator.startGradualLoadTest(maxRooms, incrementStep, intervalSeconds);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "STARTED");
        response.put("maxRooms", maxRooms);
        response.put("incrementStep", incrementStep);
        response.put("intervalSeconds", intervalSeconds);
        
        return ApiResponseGenerator.success(response, HttpStatus.OK);
    }
    
    /**
     * 스파이크 테스트
     */
    @PostMapping("/test/spike")
    @Operation(summary = "스파이크 테스트", description = "갑작스런 부하 증가를 시뮬레이션합니다")
    public ApiResponse<ApiResponse.SuccessCustomBody<Map<String, Object>>> startSpikeTest(
            @RequestParam(defaultValue = "100") int normalLoad,
            @RequestParam(defaultValue = "1000") int spikeLoad,
            @RequestParam(defaultValue = "30") int spikeDurationSeconds) {
        
        loadTestSimulator.startSpikeTest(normalLoad, spikeLoad, spikeDurationSeconds);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "STARTED");
        response.put("normalLoad", normalLoad);
        response.put("spikeLoad", spikeLoad);
        response.put("spikeDurationSeconds", spikeDurationSeconds);
        
        return ApiResponseGenerator.success(response, HttpStatus.OK);
    }
    
    /**
     * 테스트 상태 조회
     */
    @GetMapping("/test/status")
    @Operation(summary = "테스트 상태 조회", description = "현재 진행 중인 부하 테스트의 상태를 조회합니다")
    public ApiResponse<ApiResponse.SuccessCustomBody<LoadTestSimulator.SimulationStatus>> getTestStatus() {
        LoadTestSimulator.SimulationStatus status = loadTestSimulator.getCurrentStatus();
        return ApiResponseGenerator.success(status, HttpStatus.OK);
    }
    
    /**
     * 테스트 중지
     */
    @PostMapping("/test/stop")
    @Operation(summary = "테스트 중지", description = "진행 중인 부하 테스트를 중지합니다")
    public ApiResponse<ApiResponse.SuccessCustomBody<Map<String, String>>> stopTest() {
        loadTestSimulator.stopSimulation();
        
        Map<String, String> response = new HashMap<>();
        response.put("status", "STOPPED");
        response.put("message", "부하 테스트가 중지되었습니다");
        
        return ApiResponseGenerator.success(response, HttpStatus.OK);
    }
    
    /**
     * 실시간 대시보드 데이터 (SSE 엔드포인트용)
     */
    @GetMapping("/dashboard")
    @Operation(summary = "대시보드 데이터", description = "실시간 모니터링 대시보드용 데이터를 조회합니다")
    public ApiResponse<ApiResponse.SuccessCustomBody<Map<String, Object>>> getDashboardData() {
        Map<String, Object> dashboard = new HashMap<>();
        
        KafkaMetricsService.SystemMetrics metrics = metricsService.getSystemMetrics();
        
        dashboard.put("summary", Map.of(
            "activeRooms", metrics.getTotalActiveRooms(),
            "activeUsers", metrics.getTotalActiveUsers(),
            "eventsProcessed", metrics.getTotalEventsProcessed(),
            "timestamp", metrics.getTimestamp()
        ));
        
        dashboard.put("partitionLoad", metrics.getPartitionLoadDistribution());
        dashboard.put("topRooms", metrics.getTopRoomsByParticipants());
        dashboard.put("partitionMetrics", metrics.getPartitionMetrics());
        
        return ApiResponseGenerator.success(dashboard, HttpStatus.OK);
    }
    
    /**
     * 헬스체크
     */
    @GetMapping("/health")
    @Operation(summary = "카프카 헬스체크", description = "카프카 시스템의 상태를 확인합니다")
    public ApiResponse<ApiResponse.SuccessCustomBody<Map<String, String>>> healthCheck() {
        Map<String, String> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Kafka Multi-Room Partitioning System");
        health.put("version", "1.0.0");
        
        return ApiResponseGenerator.success(health, HttpStatus.OK);
    }
}