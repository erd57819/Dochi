package com.ssafy.dochi.openvidu.controller;

import com.ssafy.dochi.common.security.CustomUserDetails;
import com.ssafy.dochi.common.template.ApiResponse;
import com.ssafy.dochi.common.template.ApiResponseGenerator;
import com.ssafy.dochi.openvidu.service.OpenViduService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/openvidu")
@RequiredArgsConstructor
@Tag(name = "OpenViduController", description = "OpenVidu 세션/연결 생성")
public class OpenViduController {

    private final OpenViduService openViduService;

    // 1. 세션 생성
    @PostMapping("/session")
    public ApiResponse<ApiResponse.SuccessCustomBody<Map<String, String>>> createSession() {
        String sessionId = openViduService.createSession();
        return ApiResponseGenerator.success(Map.of("sessionId", sessionId), HttpStatus.OK);
    }

    // 2. 세션 참가 (Connection 생성)
    @PostMapping("/connection/{sessionId}")
    public ApiResponse<ApiResponse.SuccessCustomBody<Map<String, String>>> createConnection(
            @PathVariable String sessionId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        String token = openViduService.createConnection(sessionId, user.getId(), user.getName());
        return ApiResponseGenerator.success(Map.of("token", token), HttpStatus.OK);
    }
}
