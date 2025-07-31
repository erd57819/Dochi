package com.ssafy.dochi.user.controller;


import com.ssafy.dochi.common.security.CustomUserDetails;
import com.ssafy.dochi.common.template.ApiResponseGenerator;
import com.ssafy.dochi.common.template.ApiResponse;
import com.ssafy.dochi.user.dto.request.*;
import com.ssafy.dochi.user.dto.response.ProfileImageResDto;
import com.ssafy.dochi.user.dto.response.UserInfoResDto;
import com.ssafy.dochi.user.dto.response.UserLoginResDto;
import com.ssafy.dochi.user.service.ProfileImageService;
import com.ssafy.dochi.user.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import com.ssafy.dochi.user.service.EmailVerificationService;
import com.ssafy.dochi.user.dto.request.EmailReqDto;
import com.ssafy.dochi.user.dto.request.EmailVerifyReqDto;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
@Tag(name = "auth-controller", description = "이메일 인증 및 로그인 기능")
public class UserController {
    private final UserService userService;
    private final ProfileImageService profileImageService;
    private final EmailVerificationService emailVerificationService;

    // 회원가입
    @PostMapping("/regist")
    public ApiResponse<ApiResponse.SuccessCustomBody<Void>> regist(@RequestBody UserSignUpReqDto signUpReqDto) {
        userService.regist(signUpReqDto);
        return ApiResponseGenerator.success(HttpStatus.OK);
    }

    // 로그인
    @PostMapping("/login")
    public ApiResponse<ApiResponse.SuccessCustomBody<UserLoginResDto>> login(
            @RequestBody UserLoginReqDto loginReqDto) {
        UserLoginResDto response = userService.login(loginReqDto);
        return ApiResponseGenerator.success(response, HttpStatus.OK);
    }

    @PostMapping("/reissue")
    public ApiResponse<ApiResponse.SuccessCustomBody<Map<String, String>>> reissueToken(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestHeader("X-Refresh-Token") String refreshToken) {

        // 1. "Bearer " 제거
        String accessToken = authorizationHeader.replace("Bearer ", "");
        // 2. 재발급 서비스 호출
        String newAccessToken = userService.reissue(accessToken, refreshToken);
        // 3. 클라이언트에 새 AccessToken 반환
        Map<String, String> response = Map.of("accessToken", newAccessToken);
        return ApiResponseGenerator.success(response, HttpStatus.OK);
    }


    // 회원 정보 조회
    @GetMapping("/info")
    public ApiResponse<ApiResponse.SuccessCustomBody<UserInfoResDto>> userInfo(
            @AuthenticationPrincipal CustomUserDetails member) {
        System.out.println("asdfadf");
        UserInfoResDto response = userService.userInfo(member);
        return ApiResponseGenerator.success(response, HttpStatus.OK);
    }

    // 회원 정보 수정
    @PutMapping("/info")
    public ApiResponse<ApiResponse.SuccessCustomBody<Void>> updateUserInfo(
            @AuthenticationPrincipal CustomUserDetails member, @RequestBody UserUpdateReqDto updateReqDto) {
        userService.updateUserInfo(member, updateReqDto);
        return ApiResponseGenerator.success(HttpStatus.OK);
    }

    // 회원 정보 삭제
    @DeleteMapping("/delete")
    public ApiResponse<ApiResponse.SuccessCustomBody<Void>> deleteUser(
            @AuthenticationPrincipal CustomUserDetails member) {
        userService.deleteUser(member);

        return ApiResponseGenerator.success(HttpStatus.OK);
    }

    //프로필 이미지 업로드용 Presigned URL 생성
    @PostMapping("/image/presigned-url")
    public ApiResponse<ApiResponse.SuccessCustomBody<ProfileImageResDto>> generateProfileImageUploadUrl(
            @AuthenticationPrincipal CustomUserDetails customUser, @RequestBody ProfileImageReqDto request) {

        ProfileImageResDto response = profileImageService
                .generateProfileImageUploadUrl(customUser.getId(), request);
        return ApiResponseGenerator.success(response, HttpStatus.OK);
    }


    //프로필 이미지 업로드 완료 처리
    @PostMapping("/image/complete")
    public ApiResponse<ApiResponse.SuccessCustomBody<Void>> completeProfileImageUpload(
            @AuthenticationPrincipal CustomUserDetails customUser, @RequestBody ProfileImageUploadReqDto reqDto) {

        profileImageService.completeProfileImageUpload(customUser.getId(), reqDto.getImageKey());
        return ApiResponseGenerator.success(HttpStatus.OK);

    }

    //이메일 인증 코드 발송
    @PostMapping("/verify/send")
    public ApiResponse<ApiResponse.SuccessCustomBody<Void>> sendVerificationCode(@RequestBody EmailReqDto reqDto) {
        emailVerificationService.sendVerificationCode(reqDto.getEmail());
        return ApiResponseGenerator.success(HttpStatus.OK);
    }

    //인증 코드 검증
    @PostMapping("/verify/check")
    public ApiResponse<ApiResponse.SuccessCustomBody<Void>> verifyCode(@RequestBody EmailVerifyReqDto reqDto) {
        emailVerificationService.verifyCode(reqDto.getEmail(), reqDto.getCode());
        return ApiResponseGenerator.success(HttpStatus.OK);
    }

    // 비밀번호 변경
    @PutMapping("/update")
    public ApiResponse<ApiResponse.SuccessCustomBody<Void>> updatePassword(
            @AuthenticationPrincipal CustomUserDetails member,
            @RequestBody UserPasswordUpdateReqDto dto) {

        userService.updatePassword(member, dto);
        return ApiResponseGenerator.success(HttpStatus.OK);
    }





}
