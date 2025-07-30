package com.ssafy.dochi.conflict.controller;

import com.ssafy.dochi.common.security.CustomUserDetails;
import com.ssafy.dochi.common.template.ApiResponse;
import com.ssafy.dochi.common.template.ApiResponseGenerator;
import com.ssafy.dochi.conflict.dto.request.ConflictCreateReqDto;
import com.ssafy.dochi.conflict.dto.request.ConflictSummaryReqDto;
import com.ssafy.dochi.conflict.dto.request.FinalizeConflictReqDto;
import com.ssafy.dochi.conflict.dto.response.AiAnalysisResDto;
import com.ssafy.dochi.conflict.dto.response.ConflictResDto;
import com.ssafy.dochi.conflict.domain.AiAnalysisResult;
import com.ssafy.dochi.conflict.service.ConflictService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/conflict")
@Tag(name = "conflict-controller", description = "갈등 관리 API")
public class ConflictController {
    
    private final ConflictService conflictService;
    
    // 1단계: 갈등 카드를 Redis에 임시 저장
    @PostMapping("/temp")
    public ApiResponse<ApiResponse.SuccessCustomBody<String>> saveTempConflict(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody ConflictCreateReqDto reqDto) {
        
        // 테스트용: 인증 없을 때 기본 사용자 ID 사용
        Long userId = (user != null) ? user.getId() : 2L;
        String tempConflictId = conflictService.saveTempConflict(userId, reqDto);
        return ApiResponseGenerator.success(tempConflictId, HttpStatus.CREATED);
    }
    
    // 2단계: 임시 저장된 갈등 데이터를 AI 분석
    @PostMapping("/analyze/{tempConflictId}")
    public ApiResponse<ApiResponse.SuccessCustomBody<AiAnalysisResDto>> analyzeConflict(
            @PathVariable String tempConflictId) {
        
        AiAnalysisResDto response = conflictService.analyzeConflict(tempConflictId);
        return ApiResponseGenerator.success(response, HttpStatus.OK);
    }
    
    // 2-1단계: 고급 AI 분석 (감정, 관계, 소통 등) - 임시 분석만
    @PostMapping("/analyze/advanced/{tempConflictId}")
    public ApiResponse<ApiResponse.SuccessCustomBody<Map<String, Object>>> analyzeConflictAdvanced(
            @PathVariable String tempConflictId) {
        
        Map<String, Object> response = conflictService.analyzeConflictAdvanced(tempConflictId);
        return ApiResponseGenerator.success(response, HttpStatus.OK);
    }
    
    // 2-2단계: 고급 AI 분석 후 갈등 저장 및 분석 결과 MySQL 저장
    @PostMapping("/analyze/advanced/save/{tempConflictId}")
    public ApiResponse<ApiResponse.SuccessCustomBody<ConflictResDto>> analyzeAndSaveConflictAdvanced(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable String tempConflictId) {
        
        // 테스트용: 인증 없을 때 기본 사용자 ID 사용
        Long userId = (user != null) ? user.getId() : 2L;
        ConflictResDto response = conflictService.analyzeAndSaveConflictAdvanced(userId, tempConflictId);
        return ApiResponseGenerator.success(response, HttpStatus.CREATED);
    }
    
    // 3단계: AI 분석 완료 후 최종 SQL 저장
    @PostMapping("/finalize/{tempConflictId}")
    public ApiResponse<ApiResponse.SuccessCustomBody<ConflictResDto>> finalizeConflict(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable String tempConflictId,
            @RequestBody FinalizeConflictReqDto reqDto) {
        
        // 테스트용: 인증 없을 때 기본 사용자 ID 사용
        Long userId = (user != null) ? user.getId() : 2L;
        ConflictResDto response = conflictService.finalizeConflict(
            userId, 
            tempConflictId, 
            reqDto.getAiSummary(), 
            reqDto.getAiSolutions()
        );
        return ApiResponseGenerator.success(response, HttpStatus.CREATED);
    }
    
    // 기존 방식 유지 (호환성)
    @PostMapping("/create")
    public ApiResponse<ApiResponse.SuccessCustomBody<ConflictResDto>> createConflict(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody ConflictCreateReqDto reqDto) {
        
        // 테스트용: 인증 없을 때 기본 사용자 ID 사용
        Long userId = (user != null) ? user.getId() : 2L;
        ConflictResDto response = conflictService.createConflict(userId, reqDto);
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
    
    // 갈등의 AI 분석 결과 조회
    @GetMapping("/{conflictId}/analysis")
    public ApiResponse<ApiResponse.SuccessCustomBody<AiAnalysisResult>> getConflictAnalysis(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long conflictId) {
        
        AiAnalysisResult analysis = conflictService.getConflictAnalysis(conflictId, user.getId());
        return ApiResponseGenerator.success(analysis, HttpStatus.OK);
    }
}