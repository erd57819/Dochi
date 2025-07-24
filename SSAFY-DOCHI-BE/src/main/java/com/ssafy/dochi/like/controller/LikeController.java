package com.ssafy.dochi.like.controller;

import com.ssafy.dochi.common.template.ApiResponse;
import com.ssafy.dochi.common.template.ApiResponseGenerator;
import com.ssafy.dochi.like.dto.request.CommentLikeReqDto;
import com.ssafy.dochi.like.dto.request.PostLikeReqDto;
import com.ssafy.dochi.like.dto.response.LikeStatsResDto;
import com.ssafy.dochi.like.service.LikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * 좋아요 컨트롤러
 */
@Tag(name = "좋아요 관리", description = "게시글/댓글 좋아요 API")
@Slf4j
@RestController
@RequestMapping("/api/likes")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    @Operation(summary = "게시글 좋아요/싫어요 토글", description = "게시글에 좋아요 또는 싫어요를 등록/취소/변경합니다.")
    @PostMapping("/posts")
    public ApiResponse<?> togglePostLike(@Valid @RequestBody PostLikeReqDto postLikeReqDto) {
        log.info("게시글 좋아요 토글 API 호출: {}", postLikeReqDto);
        
        try {
            LikeStatsResDto result = likeService.togglePostLike(postLikeReqDto);
            return ApiResponseGenerator.success(result, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ApiResponseGenerator.fail(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("게시글 좋아요 처리 중 오류 발생", e);
            return ApiResponseGenerator.fail("게시글 좋아요 처리에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "댓글 좋아요/싫어요 토글", description = "댓글에 좋아요 또는 싫어요를 등록/취소/변경합니다.")
    @PostMapping("/comments")
    public ApiResponse<?> toggleCommentLike(@Valid @RequestBody CommentLikeReqDto commentLikeReqDto) {
        log.info("댓글 좋아요 토글 API 호출: {}", commentLikeReqDto);
        
        try {
            LikeStatsResDto result = likeService.toggleCommentLike(commentLikeReqDto);
            return ApiResponseGenerator.success(result, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ApiResponseGenerator.fail(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("댓글 좋아요 처리 중 오류 발생", e);
            return ApiResponseGenerator.fail("댓글 좋아요 처리에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "게시글 좋아요 통계 조회", description = "게시글의 좋아요/싫어요 통계를 조회합니다.")
    @GetMapping("/posts/{postId}")
    public ApiResponse<?> getPostLikeStats(
            @Parameter(description = "게시글 ID") @PathVariable Long postId,
            @Parameter(description = "사용자 ID (옵션)") @RequestParam(required = false) Long userId) {
        log.info("게시글 좋아요 통계 조회 API 호출: postId={}, userId={}", postId, userId);
        
        try {
            LikeStatsResDto stats = likeService.getPostLikeStats(postId, userId);
            return ApiResponseGenerator.success(stats, HttpStatus.OK);
        } catch (Exception e) {
            log.error("게시글 좋아요 통계 조회 중 오류 발생", e);
            return ApiResponseGenerator.fail("게시글 좋아요 통계 조회에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "댓글 좋아요 통계 조회", description = "댓글의 좋아요/싫어요 통계를 조회합니다.")
    @GetMapping("/comments/{commentId}")
    public ApiResponse<?> getCommentLikeStats(
            @Parameter(description = "댓글 ID") @PathVariable Long commentId,
            @Parameter(description = "사용자 ID (옵션)") @RequestParam(required = false) Long userId) {
        log.info("댓글 좋아요 통계 조회 API 호출: commentId={}, userId={}", commentId, userId);
        
        try {
            LikeStatsResDto stats = likeService.getCommentLikeStats(commentId, userId);
            return ApiResponseGenerator.success(stats, HttpStatus.OK);
        } catch (Exception e) {
            log.error("댓글 좋아요 통계 조회 중 오류 발생", e);
            return ApiResponseGenerator.fail("댓글 좋아요 통계 조회에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
