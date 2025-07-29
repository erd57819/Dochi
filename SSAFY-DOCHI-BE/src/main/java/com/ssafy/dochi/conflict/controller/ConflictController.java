package com.ssafy.dochi.conflict.controller;

import com.ssafy.dochi.common.security.CustomUserDetails;
import com.ssafy.dochi.common.template.ApiResponse;
import com.ssafy.dochi.common.template.ApiResponseGenerator;
import com.ssafy.dochi.conflict.dto.request.ConflictCreateReqDto;
import com.ssafy.dochi.conflict.dto.request.ConflictSummaryReqDto;
import com.ssafy.dochi.conflict.dto.response.ConflictResDto;
import com.ssafy.dochi.conflict.service.ConflictService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/conflict")
@Tag(name = "conflict-controller", description = "갈등 관리 API")
public class ConflictController {
    
    private final ConflictService conflictService;
    
    // 갈등 생성
    @PostMapping("/create")
    public ApiResponse<ApiResponse.SuccessCustomBody<ConflictResDto>> createConflict(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody ConflictCreateReqDto reqDto) {
        
        ConflictResDto response = conflictService.createConflict(user.getId(), reqDto);
        return ApiResponseGenerator.success(response, HttpStatus.CREATED);
    }
    
    // AI 요약 생성
    @PostMapping("/summarize")
    public ApiResponse<ApiResponse.SuccessCustomBody<String>> summarizeConflict(
            @RequestBody ConflictSummaryReqDto reqDto) {
        
        String summary = conflictService.generateAiSummary(reqDto);
        return ApiResponseGenerator.success(summary, HttpStatus.OK);
    }
    
    // 갈등 상세 조회
    @GetMapping("/{conflictId}")
    public ApiResponse<ApiResponse.SuccessCustomBody<ConflictResDto>> getConflict(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long conflictId) {
        
        ConflictResDto response = conflictService.getConflict(conflictId, user.getId());
        return ApiResponseGenerator.success(response, HttpStatus.OK);
    }
    
    // 사용자별 갈등 목록 조회
    @GetMapping("/list")
    public ApiResponse<ApiResponse.SuccessCustomBody<List<ConflictResDto>>> getUserConflicts(
            @AuthenticationPrincipal CustomUserDetails user) {
        
        List<ConflictResDto> response = conflictService.getUserConflicts(user.getId());
        return ApiResponseGenerator.success(response, HttpStatus.OK);
    }
    
    // 갈등 삭제
    @DeleteMapping("/{conflictId}")
    public ApiResponse<ApiResponse.SuccessCustomBody<Void>> deleteConflict(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long conflictId) {
        
        conflictService.deleteConflict(conflictId, user.getId());
        return ApiResponseGenerator.success(HttpStatus.OK);
    }
    
    // 사용자별 갈등 개수 조회
    @GetMapping("/count")
    public ApiResponse<ApiResponse.SuccessCustomBody<Integer>> getUserConflictCount(
            @AuthenticationPrincipal CustomUserDetails user) {
        
        Integer count = conflictService.getUserConflictCount(user.getId());
        return ApiResponseGenerator.success(count, HttpStatus.OK);
    }
}