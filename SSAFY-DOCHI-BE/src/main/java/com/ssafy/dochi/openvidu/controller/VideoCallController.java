package com.ssafy.dochi.openvidu.controller;

import com.ssafy.dochi.common.security.CustomUserDetails;
import com.ssafy.dochi.common.template.ApiResponse;
import com.ssafy.dochi.common.template.ApiResponseGenerator;
import com.ssafy.dochi.openvidu.dto.VideoCallRoomCreateReqDto;
import com.ssafy.dochi.openvidu.dto.VideoCallRoomCreateResDto;
import com.ssafy.dochi.openvidu.dto.VideoCallRoomJoinReqDto;
import com.ssafy.dochi.openvidu.service.VideoCallService;
import com.ssafy.dochi.conflict.service.AiSummaryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/video-call")
@RequiredArgsConstructor
@Tag(name = "VideoCallController", description = "영상통화방 관리")
public class VideoCallController {

    private final VideoCallService videoCallService;
    private final AiSummaryService aiSummaryService;

    @PostMapping("/rooms")
    public ApiResponse<?> createRoom(
            @RequestBody VideoCallRoomCreateReqDto request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        VideoCallRoomCreateResDto response = videoCallService.createRoom(request, userDetails.getId());
        return ApiResponseGenerator.success(response, HttpStatus.OK);
    }

    @PostMapping("/rooms/join")
    public ApiResponse<?> joinRoom(
            @RequestBody VideoCallRoomJoinReqDto request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String token = videoCallService.joinRoom(request.getRoomCode(), userDetails.getId());
        return ApiResponseGenerator.success(token, HttpStatus.OK);
    }

    @GetMapping("/rooms/{roomCode}")
    public ApiResponse<?> getRoomInfo(@PathVariable String roomCode) {
        Object roomInfo = videoCallService.getRoomInfo(roomCode);
        return ApiResponseGenerator.success(roomInfo, HttpStatus.OK);
    }

    @PutMapping("/rooms/{roomCode}/end")
    public ApiResponse<?> endCall(@PathVariable String roomCode) {
        boolean result = videoCallService.endCall(roomCode);
        return ApiResponseGenerator.success(result, HttpStatus.OK);
    }

    // LiveKit 토큰 직접 발급 엔드포인트 (기존 프론트엔드 호환용)
    @PostMapping("/token")
    public ApiResponse<?> generateToken(
            @RequestParam String room,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        // 인증되지 않은 사용자 처리
        if (userDetails == null) {
            return ApiResponseGenerator.fail("인증이 필요합니다", HttpStatus.UNAUTHORIZED);
        }

        
        String token = videoCallService.joinRoom(room, userDetails.getId());
        return ApiResponseGenerator.success(Map.of("token", token), HttpStatus.OK);
    }

    // 게스트 사용자 토큰 발급 엔드포인트
    @PostMapping("/guest-token")
    public ApiResponse<?> generateGuestToken(
            @RequestBody Map<String, Object> request
    ) {
        try {
            String room = (String) request.get("room");
            String identity = (String) request.get("identity");
            String name = (String) request.get("name");
            
            // 필수 파라미터 검증
            if (room == null || identity == null || name == null) {
                return ApiResponseGenerator.fail("room, identity, name 파라미터가 필요합니다", HttpStatus.BAD_REQUEST);
            }
            
            // 게스트용 LiveKit 토큰 생성
            String token = videoCallService.createGuestToken(room, identity, name);
            return ApiResponseGenerator.success(Map.of("token", token), HttpStatus.OK);
            
        } catch (Exception e) {
            return ApiResponseGenerator.fail("게스트 토큰 생성 실패: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // AI 중재 서비스 엔드포인트
    @PostMapping("/ai/mediation")
    public ApiResponse<?> requestAiMediation(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        try {
            String roomCode = (String) request.get("roomCode");
            String speaker = (String) request.get("speaker");
            String text = (String) request.get("text");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> conversationHistory = (List<Map<String, Object>>) request.get("conversationHistory");
            
            // 대화 내용을 하나의 텍스트로 합치기
            StringBuilder conversationText = new StringBuilder();
            if (conversationHistory != null) {
                for (Map<String, Object> conv : conversationHistory) {
                    String convSpeaker = (String) conv.get("speaker");
                    String convText = (String) conv.get("text");
                    conversationText.append(convSpeaker).append(": ").append(convText).append("\n");
                }
            }
            conversationText.append(speaker).append(": ").append(text);
            
            // AI 서비스 호출 (갈등 유형을 ONLINE으로 설정)
            String aiSuggestion = aiSummaryService.generateSummary(
                conversationText.toString(), 
                com.ssafy.dochi.conflict.domain.UserConflict.ConflictType.ONLINE
            );
            
            // AI 중재 제안으로 가공
            String suggestion = generateMediationSuggestion(aiSuggestion, text);
            
            return ApiResponseGenerator.success(Map.of("suggestion", suggestion), HttpStatus.OK);
            
        } catch (Exception e) {
            return ApiResponseGenerator.fail("AI 중재 서비스 오류: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    private String generateMediationSuggestion(String aiSummary, String currentText) {
        // 감정적 표현 감지
        if (currentText.contains("화나") || currentText.contains("짜증") || currentText.contains("분노")) {
            return "💡 감정이 격해지고 있습니다. 잠시 심호흡을 하고 상대방의 입장을 이해해보는 것은 어떨까요?";
        }
        
        // 비난이나 공격적 언어 감지
        if (currentText.contains("너만") || currentText.contains("항상") || currentText.contains("절대")) {
            return "🤝 '너' 보다는 '나'를 주語로 하여 자신의 감정을 표현해보세요. 예: '나는 ~라고 느껴요'";
        }
        
        // 해결책 모색하는 발언 감지
        if (currentText.contains("어떻게") || currentText.contains("방법") || currentText.contains("해결")) {
            return "✨ 좋은 방향으로 대화가 진행되고 있습니다. 구체적인 해결 방안을 함께 논의해보세요.";
        }
        
        // 기본 중재 제안
        return "🎯 상대방의 말을 끝까지 들어보고, 서로의 입장을 이해하려 노력해보세요.";
    }
}