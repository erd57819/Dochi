package com.ssafy.dochi.openvidu.controller;

import com.ssafy.dochi.common.security.CustomUserDetails;
import com.ssafy.dochi.common.template.ApiResponse;
import com.ssafy.dochi.common.template.ApiResponseGenerator;
import com.ssafy.dochi.openvidu.dto.OpenViduTokenResDto;
import com.ssafy.dochi.openvidu.service.OpenViduService;
import com.ssafy.dochi.user.domain.User;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/openvidu")
@RequiredArgsConstructor
@Tag(name = "OpenViduController", description = "LiveKit 토큰 발급")
public class OpenViduController {

    private final OpenViduService openViduService;

    @PostMapping("/token")
    public ApiResponse<?> createToken(
            @RequestParam String room
    ) {
        // SecurityContext에서 인증 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        String identity;
        Long userId;
        
        if (authentication != null && authentication.isAuthenticated() && 
            authentication.getPrincipal() instanceof CustomUserDetails) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            identity = "user-" + userDetails.getId();
            userId = userDetails.getId();
        } else {
            // 인증되지 않은 사용자를 위한 임시 처리
            identity = "guest-" + System.currentTimeMillis();
            userId = 0L; // 게스트 사용자
        }

        String token = openViduService.createToken(
                room,
                identity,
                List.of("join", "publish", "subscribe"),
                userId
        );

        return ApiResponseGenerator.success(new OpenViduTokenResDto(token), HttpStatus.OK);
    }
}
