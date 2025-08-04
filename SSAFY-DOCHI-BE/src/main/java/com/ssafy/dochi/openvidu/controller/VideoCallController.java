package com.ssafy.dochi.openvidu.controller;

import com.ssafy.dochi.common.security.CustomUserDetails;
import com.ssafy.dochi.common.template.ApiResponse;
import com.ssafy.dochi.common.template.ApiResponseGenerator;
import com.ssafy.dochi.openvidu.dto.VideoCallRoomCreateReqDto;
import com.ssafy.dochi.openvidu.dto.VideoCallRoomCreateResDto;
import com.ssafy.dochi.openvidu.dto.VideoCallRoomJoinReqDto;
import com.ssafy.dochi.openvidu.service.VideoCallService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/video-call")
@RequiredArgsConstructor
@Tag(name = "VideoCallController", description = "영상통화방 관리")
public class VideoCallController {

    private final VideoCallService videoCallService;

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
        String token = videoCallService.joinRoom(room, userDetails.getId());
        return ApiResponseGenerator.success(Map.of("token", token), HttpStatus.OK);
    }
}