package com.ssafy.dochi.comment.controller;

import com.ssafy.dochi.comment.dto.request.CommentSaveReqDto;
import com.ssafy.dochi.comment.dto.request.CommentUpdateReqDto;
import com.ssafy.dochi.comment.dto.response.CommentResDto;
import com.ssafy.dochi.comment.service.CommentService;
import com.ssafy.dochi.common.template.ApiResponse;
import com.ssafy.dochi.common.template.ApiResponseGenerator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 댓글 컨트롤러
 */
@Tag(name = "댓글 관리", description = "댓글 CRUD API")
@Slf4j
@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @Operation(summary = "댓글 등록", description = "새로운 댓글을 등록합니다.")
    @PostMapping
    public ApiResponse<?> saveComment(@Valid @RequestBody CommentSaveReqDto commentSaveReqDto) {
        log.info("댓글 등록 API 호출: {}", commentSaveReqDto);
        
        try {
            Long commentId = commentService.saveComment(commentSaveReqDto);
            return ApiResponseGenerator.success(commentId, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ApiResponseGenerator.fail(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("댓글 등록 중 오류 발생", e);
            return ApiResponseGenerator.fail("댓글 등록에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "댓글 수정", description = "기존 댓글을 수정합니다.")
    @PutMapping("/{commentId}")
    public ApiResponse<?> updateComment(
            @Parameter(description = "댓글 ID") @PathVariable Long commentId,
            @Valid @RequestBody CommentUpdateReqDto commentUpdateReqDto) {
        log.info("댓글 수정 API 호출: commentId={}, {}", commentId, commentUpdateReqDto);
        
        try {
            commentUpdateReqDto.setId(commentId);
            commentService.updateComment(commentUpdateReqDto);
            return ApiResponseGenerator.success(HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ApiResponseGenerator.fail(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("댓글 수정 중 오류 발생", e);
            return ApiResponseGenerator.fail("댓글 수정에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "댓글 삭제", description = "댓글을 삭제합니다.")
    @DeleteMapping("/{commentId}")
    public ApiResponse<?> deleteComment(
            @Parameter(description = "댓글 ID") @PathVariable Long commentId,
            @Parameter(description = "사용자 ID") @RequestParam Long userId) {
        log.info("댓글 삭제 API 호출: commentId={}, userId={}", commentId, userId);
        
        try {
            commentService.deleteComment(commentId, userId);
            return ApiResponseGenerator.success(HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ApiResponseGenerator.fail(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("댓글 삭제 중 오류 발생", e);
            return ApiResponseGenerator.fail("댓글 삭제에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "게시글 댓글 목록 조회", description = "특정 게시글의 모든 댓글을 조회합니다.")
    @GetMapping("/post/{postId}")
    public ApiResponse<?> getCommentsByPostId(
            @Parameter(description = "게시글 ID") @PathVariable Long postId) {
        log.info("게시글 댓글 목록 조회 API 호출: postId={}", postId);
        
        try {
            List<CommentResDto> comments = commentService.getCommentsByPostId(postId);
            return ApiResponseGenerator.success(comments, HttpStatus.OK);
        } catch (Exception e) {
            log.error("댓글 목록 조회 중 오류 발생", e);
            return ApiResponseGenerator.fail("댓글 목록 조회에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "댓글 상세 조회", description = "특정 댓글의 상세 정보를 조회합니다.")
    @GetMapping("/{commentId}")
    public ApiResponse<?> getCommentById(
            @Parameter(description = "댓글 ID") @PathVariable Long commentId) {
        log.info("댓글 상세 조회 API 호출: commentId={}", commentId);
        
        try {
            CommentResDto comment = commentService.getCommentById(commentId);
            return ApiResponseGenerator.success(comment, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ApiResponseGenerator.fail(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            log.error("댓글 상세 조회 중 오류 발생", e);
            return ApiResponseGenerator.fail("댓글 조회에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "사용자 댓글 목록 조회", description = "특정 사용자의 댓글 목록을 조회합니다.")
    @GetMapping("/user/{userId}")
    public ApiResponse<?> getCommentsByUserId(
            @Parameter(description = "사용자 ID") @PathVariable Long userId,
            @Parameter(description = "페이지 번호 (기본값: 1)") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "페이지 크기 (기본값: 10)") @RequestParam(defaultValue = "10") int size) {
        log.info("사용자 댓글 목록 조회 API 호출: userId={}, page={}, size={}", userId, page, size);
        
        try {
            List<CommentResDto> comments = commentService.getCommentsByUserId(userId, page, size);
            return ApiResponseGenerator.success(comments, HttpStatus.OK);
        } catch (Exception e) {
            log.error("사용자 댓글 목록 조회 중 오류 발생", e);
            return ApiResponseGenerator.fail("사용자 댓글 목록 조회에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
