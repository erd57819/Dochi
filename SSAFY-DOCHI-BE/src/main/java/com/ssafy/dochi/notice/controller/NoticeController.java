package com.ssafy.dochi.notice.controller;

import java.util.List;

import com.ssafy.dochi.notice.dto.response.NoticePageResDto;
import com.ssafy.dochi.notice.dto.response.NoticeResDto;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.ssafy.dochi.common.security.CustomUserDetails;
import com.ssafy.dochi.common.template.ApiResponse;
import com.ssafy.dochi.common.template.ApiResponseGenerator;
import com.ssafy.dochi.notice.dto.request.NoticeSaveReqDto;
import com.ssafy.dochi.notice.dto.request.NoticeUpdateReqDto;
import com.ssafy.dochi.notice.dto.response.NoticeInfoResDto;
import com.ssafy.dochi.notice.service.NoticeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    // 🔹 공지 목록 조회 (페이징, 검색)
    @GetMapping
    public ApiResponse<ApiResponse.SuccessCustomBody<NoticePageResDto<NoticeResDto>>> getNotices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {

        NoticePageResDto<NoticeResDto> notices = noticeService.findAll(page, size, search, category);
        return ApiResponseGenerator.success(notices, HttpStatus.OK);
    }

    // 🔹 공지 작성 (관리자만)
    @PostMapping
    public ApiResponse<ApiResponse.SuccessCustomBody<Void>> createNotice(
            @RequestBody NoticeSaveReqDto dto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        noticeService.save(dto, userDetails.getId());
        return ApiResponseGenerator.success(HttpStatus.CREATED);
    }

    // 🔹 공지 상세 조회 (조회수 증가 포함)
    @GetMapping("/{noticeId}")
    public ApiResponse<ApiResponse.SuccessCustomBody<NoticeInfoResDto>> getNoticeDetail(
            @PathVariable("noticeId") Long id) {
        NoticeInfoResDto notice = noticeService.findById(id);
        return ApiResponseGenerator.success(notice, HttpStatus.OK);
    }

    // 🔹 공지 수정 (관리자만)
    @PutMapping("/{noticeId}")
    public ApiResponse<ApiResponse.SuccessCustomBody<Void>> updateNotice(
            @PathVariable("noticeId") Long id,
            @RequestBody NoticeUpdateReqDto dto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        dto.setId(id);
        noticeService.update(dto, userDetails.getId());
        return ApiResponseGenerator.success(HttpStatus.OK);
    }

    // 🔹 공지 삭제 (관리자만)
    @DeleteMapping("/{noticeId}")
    public ApiResponse<ApiResponse.SuccessCustomBody<Void>> deleteNotice(
            @PathVariable("noticeId") Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        noticeService.delete(id, userDetails.getId());
        return ApiResponseGenerator.success(HttpStatus.OK);
    }

    // 🔹 중요 공지 목록 조회
    @GetMapping("/important")
    public ApiResponse<ApiResponse.SuccessCustomBody<List<NoticeResDto>>> getImportantNotices() {
        List<NoticeResDto> notices = noticeService.findImportantNotices();
        return ApiResponseGenerator.success(notices, HttpStatus.OK);
    }

    // 🔹 팝업 공지 목록 조회
    @GetMapping("/popup")
    public ApiResponse<ApiResponse.SuccessCustomBody<List<NoticeResDto>>> getPopupNotices() {
        List<NoticeResDto> notices = noticeService.findPopupNotices();
        return ApiResponseGenerator.success(notices, HttpStatus.OK);
    }
}