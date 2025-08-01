package com.ssafy.dochi.user.controller;

import com.ssafy.dochi.common.template.ApiResponseGenerator;
import com.ssafy.dochi.user.dto.response.UserLoginResDto;
import com.ssafy.dochi.user.service.KakaoOAuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.ssafy.dochi.common.template.ApiResponse;
@RestController
@RequestMapping("/api/oauth")
public class KakaoOAuthController {
    private final KakaoOAuthService kakaoOAuthService;

    public KakaoOAuthController(KakaoOAuthService kakaoOAuthService){
        this.kakaoOAuthService = kakaoOAuthService;
    }

    @GetMapping
    public ApiResponse<ApiResponse.SuccessCustomBody<UserLoginResDto>> kakaoCallback(@RequestParam String code) {
        UserLoginResDto response = kakaoOAuthService.processKakaoLogin(code);
        return ApiResponseGenerator.success(response, HttpStatus.OK);
    }

    @PostMapping("/withdraw")
    public ApiResponse<?> kakaoWithdraw(@RequestParam String code) {
        kakaoOAuthService.withdrawByKakaoCode(code);
        return ApiResponseGenerator.success(HttpStatus.OK);
    }
}
