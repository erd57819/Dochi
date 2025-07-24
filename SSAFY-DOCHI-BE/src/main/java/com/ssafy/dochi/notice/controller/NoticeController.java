package com.ssafy.dochi.notice.controller;

import com.ssafy.dochi.notice.dto.response.NoticePageResDto;
import com.ssafy.dochi.notice.dto.response.NoticeResDto;
import com.ssafy.dochi.notice.domain.Notice.NoticeCategory;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.ssafy.dochi.notice.dto.request.NoticeSaveReqDto;
import com.ssafy.dochi.notice.dto.request.NoticeUpdateReqDto;
import com.ssafy.dochi.notice.dto.response.NoticeInfoResDto;
import com.ssafy.dochi.notice.service.NoticeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notice")
@RequiredArgsConstructor
@Tag(name = "공지사항", description = "공지사항 관리 API")
public class NoticeController {

    private final NoticeService noticeService;

    @Operation(summary = "공지사항 목록 조회")
    @GetMapping
    public ResponseEntity<NoticePageResDto<NoticeResDto>> getNotices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) NoticeCategory category,
            @RequestParam(required = false) Boolean isImportant) {

        NoticePageResDto<NoticeResDto> notices = noticeService.findAll(page, size, search, category, isImportant);
        return ResponseEntity.ok(notices);
    }

    @Operation(summary = "공지사항 작성")
    @PostMapping
    public ResponseEntity<Void> create(@RequestBody NoticeSaveReqDto dto) {
        Long tempUserId = 1L; // 테스트용
        noticeService.save(dto, tempUserId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(summary = "공지사항 상세 조회")
    @GetMapping("/{noticeId}")
    public ResponseEntity<NoticeInfoResDto> detail(@PathVariable("noticeId") Long id) {
        NoticeInfoResDto notice = noticeService.findById(id);
        return ResponseEntity.ok(notice);
    }

    @Operation(summary = "공지사항 수정")
    @PutMapping("/{noticeId}")
    public ResponseEntity<Void> update(@PathVariable("noticeId") Long id, @RequestBody NoticeUpdateReqDto dto) {
        dto.setId(id);
        noticeService.update(dto);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "공지사항 삭제")
    @DeleteMapping("/{noticeId}")
    public ResponseEntity<Void> delete(@PathVariable("noticeId") Long id) {
        noticeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}