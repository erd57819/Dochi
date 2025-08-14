package com.ssafy.dochi.kafka.controller;

import com.ssafy.dochi.common.security.CustomUserDetails;
import com.ssafy.dochi.common.template.ApiResponse;
import com.ssafy.dochi.common.template.ApiResponseGenerator;
import com.ssafy.dochi.kafka.dto.RoomMetricsDto;
import com.ssafy.dochi.kafka.dto.UserActivityDto;
import com.ssafy.dochi.kafka.service.KafkaProducerService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/kafka")
@RequiredArgsConstructor
@Tag(name = "KafkaController", description = "Kafka 메트릭 및 활동 데이터 수집")
public class KafkaController {

    private final KafkaProducerService kafkaProducerService;

    @PostMapping("/room-metrics")
    public ApiResponse<?> sendRoomMetrics(@RequestBody RoomMetricsDto roomMetrics) {
        try {
            // 타임스탬프가 없으면 현재 시간으로 설정
            if (roomMetrics.getTimestamp() == null) {
                roomMetrics.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            }
            
            kafkaProducerService.sendRoomMetrics(roomMetrics);
            return ApiResponseGenerator.success("룸 메트릭 전송 완료", HttpStatus.OK);
            
        } catch (Exception e) {
            return ApiResponseGenerator.fail("룸 메트릭 전송 실패: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/user-activity")
    public ApiResponse<?> sendUserActivity(@RequestBody UserActivityDto userActivity) {
        try {
            // 타임스탬프가 없으면 현재 시간으로 설정
            if (userActivity.getTimestamp() == null) {
                userActivity.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            }
            
            kafkaProducerService.sendUserActivity(userActivity);
            return ApiResponseGenerator.success("사용자 활동 데이터 전송 완료", HttpStatus.OK);
            
        } catch (Exception e) {
            return ApiResponseGenerator.fail("사용자 활동 데이터 전송 실패: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 관리자 권한 체크 메서드
    private boolean isAdmin(CustomUserDetails userDetails) {
        if (userDetails == null) return false;
        
        String userId = userDetails.getUsername();
        // 관리자 조건: admin, ssafysy, ssafy 등 개발자 계정
        return "admin".equals(userId) || 
               "ssafysy".equals(userId) || 
               "ssafy".equals(userId) ||
               userId.toLowerCase().contains("admin");
    }

    // 대량 메트릭 전송을 위한 배치 엔드포인트 (관리자 전용)
    @PostMapping("/room-metrics/batch")
    public ApiResponse<?> sendBatchRoomMetrics(
            @RequestParam String roomId, 
            @RequestParam int count,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            // 관리자 권한 체크
            if (!isAdmin(userDetails)) {
                return ApiResponseGenerator.fail("관리자만 접근할 수 있습니다.", HttpStatus.FORBIDDEN);
            }
            
            kafkaProducerService.sendBatchRoomMetrics(roomId, count);
            return ApiResponseGenerator.success(count + "개의 룸 메트릭 배치 전송 완료", HttpStatus.OK);
            
        } catch (Exception e) {
            return ApiResponseGenerator.fail("배치 룸 메트릭 전송 실패: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/user-activity/batch")
    public ApiResponse<?> sendBatchUserActivity(
            @RequestParam String roomId, 
            @RequestParam int count,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            // 관리자 권한 체크
            if (!isAdmin(userDetails)) {
                return ApiResponseGenerator.fail("관리자만 접근할 수 있습니다.", HttpStatus.FORBIDDEN);
            }
            
            kafkaProducerService.sendBatchUserActivity(roomId, count);
            return ApiResponseGenerator.success(count + "개의 사용자 활동 배치 전송 완료", HttpStatus.OK);
            
        } catch (Exception e) {
            return ApiResponseGenerator.fail("배치 사용자 활동 데이터 전송 실패: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}