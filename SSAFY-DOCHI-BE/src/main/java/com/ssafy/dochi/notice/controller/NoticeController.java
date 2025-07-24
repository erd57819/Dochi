package com.ssafy.dochi.notice.controller;

import java.util.List;

import com.ssafy.dochi.notice.dto.response.NoticePageResDto;
import com.ssafy.dochi.notice.dto.response.NoticeResDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.ssafy.dochi.common.security.CustomUserDetails;
import com.ssafy.dochi.common.template.ApiResponseGenerator;
import com.ssafy.dochi.notice.dto.request.NoticeSaveReqDto;
import com.ssafy.dochi.notice.dto.request.NoticeUpdateReqDto;
import com.ssafy.dochi.notice.dto.response.NoticeInfoResDto;
import com.ssafy.dochi.notice.service.NoticeService;

import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
@Tag(name = "Notice", description = "공지사항 관리 API")
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping
    @Operation(summary = "공지사항 목록 조회")
    public com.ssafy.dochi.common.template.ApiResponse<?> getNotices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {

        try {
            NoticePageResDto<NoticeResDto> notices = noticeService.findAll(page, size, search, category);
            return ApiResponseGenerator.success(notices, HttpStatus.OK);
        } catch (Exception e) {
            return ApiResponseGenerator.fail("공지사항 조회 중 오류: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping
    @Operation(summary = "공지사항 작성")
    public com.ssafy.dochi.common.template.ApiResponse<?> createNotice(
            @Valid @RequestBody NoticeSaveReqDto dto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        try {
            // TODO: 유저 모듈 완성 후 실제 인증 적용
            Long userId = (userDetails != null && userDetails.getId() != null) ? userDetails.getId() : 1L;
            noticeService.save(dto, userId);
            return ApiResponseGenerator.success(HttpStatus.CREATED);
        } catch (Exception e) {
            return ApiResponseGenerator.fail("공지사항 작성 중 오류: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{noticeId}")
    @Operation(summary = "공지사항 상세 조회")
    public com.ssafy.dochi.common.template.ApiResponse<?> getNoticeDetail(
            @PathVariable("noticeId") Long id) {

        try {
            NoticeInfoResDto notice = noticeService.findById(id);
            return ApiResponseGenerator.success(notice, HttpStatus.OK);
        } catch (Exception e) {
            return ApiResponseGenerator.fail("공지사항을 찾을 수 없습니다: " + e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{noticeId}")
    @Operation(summary = "공지사항 수정")
    public com.ssafy.dochi.common.template.ApiResponse<?> updateNotice(
            @PathVariable("noticeId") Long id,
            @Valid @RequestBody NoticeUpdateReqDto dto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        try {
            dto.setId(id);
            Long userId = (userDetails != null && userDetails.getId() != null) ? userDetails.getId() : 1L;
            noticeService.update(dto, userId);
            return ApiResponseGenerator.success(HttpStatus.OK);
        } catch (Exception e) {
            return ApiResponseGenerator.fail("공지사항 수정 중 오류: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{noticeId}")
    @Operation(summary = "공지사항 삭제")
    public com.ssafy.dochi.common.template.ApiResponse<?> deleteNotice(
            @PathVariable("noticeId") Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        try {
            Long userId = (userDetails != null && userDetails.getId() != null) ? userDetails.getId() : 1L;
            noticeService.delete(id, userId);
            return ApiResponseGenerator.success(HttpStatus.OK);
        } catch (Exception e) {
            return ApiResponseGenerator.fail("공지사항 삭제 중 오류: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/important")
    @Operation(summary = "중요 공지사항 조회")
    public com.ssafy.dochi.common.template.ApiResponse<?> getImportantNotices() {
        try {
            List<NoticeResDto> notices = noticeService.findImportantNotices();
            return ApiResponseGenerator.success(notices, HttpStatus.OK);
        } catch (Exception e) {
            return ApiResponseGenerator.fail("중요 공지사항 조회 중 오류: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/popup")
    @Operation(summary = "팝업 공지사항 조회")
    public com.ssafy.dochi.common.template.ApiResponse<?> getPopupNotices() {
        try {
            List<NoticeResDto> notices = noticeService.findPopupNotices();
            return ApiResponseGenerator.success(notices, HttpStatus.OK);
        } catch (Exception e) {
            return ApiResponseGenerator.fail("팝업 공지사항 조회 중 오류: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}