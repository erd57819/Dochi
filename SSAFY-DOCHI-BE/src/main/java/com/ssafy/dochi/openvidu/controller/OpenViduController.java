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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
            @RequestParam String room,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        // identity를 사용자별로 고유하게 구성 (예: "user-7")
        String identity = "user-" + userDetails.getId();

        String token = openViduService.createToken(
                room,
                identity,
                List.of("join", "publish", "subscribe"),
                userDetails.getId()
        );

        return ApiResponseGenerator.success(new OpenViduTokenResDto(token), HttpStatus.OK);
    }
}
