package com.ssafy.dochi.notice.controller;

import com.ssafy.dochi.notice.dto.response.NoticePageResDto;
import com.ssafy.dochi.notice.dto.response.NoticeResDto;
import com.ssafy.dochi.notice.domain.Notice.NoticeCategory;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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

    @Operation(summary = "공지사항 목록 조회", description = "페이징과 검색, 카테고리 필터 기능을 포함한 공지사항 목록을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청")
    })
    @GetMapping
    public ResponseEntity<NoticePageResDto<NoticeResDto>> getNotices(
            @Parameter(description = "페이지 번호 (0부터 시작)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기", example = "10")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "검색어 (제목 또는 내용)", example = "공지")
            @RequestParam(required = false) String search,
            @Parameter(description = "카테고리 필터", example = "ANNOUNCEMENT")
            @RequestParam(required = false) NoticeCategory category,
            @Parameter(description = "중요 공지만 조회", example = "true")
            @RequestParam(required = false) Boolean isImportant) {

        NoticePageResDto<NoticeResDto> notices = noticeService.findAll(page, size, search, category, isImportant);
        return ResponseEntity.ok(notices);
    }

    @Operation(summary = "공지사항 작성", description = "새로운 공지사항을 작성합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "작성 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청")
    })
    @PostMapping
    public ResponseEntity<Void> create(
            @Parameter(description = "공지사항 작성 정보")
            @RequestBody NoticeSaveReqDto dto) {
        // 테스트용으로 임시 userId 사용 (실제로는 인증된 사용자 ID 사용)
        Long tempUserId = 1L;
        noticeService.save(dto, tempUserId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(summary = "공지사항 상세 조회", description = "특정 공지사항의 상세 정보를 조회합니다. (조회수 증가)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "404", description = "공지사항을 찾을 수 없음")
    })
    @GetMapping("/{noticeId}")
    public ResponseEntity<NoticeInfoResDto> detail(
            @Parameter(description = "공지사항 ID", example = "1")
            @PathVariable("noticeId") Long id) {
        NoticeInfoResDto notice = noticeService.findById(id);
        return ResponseEntity.ok(notice);
    }

    @Operation(summary = "공지사항 수정", description = "기존 공지사항을 수정합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "404", description = "공지사항을 찾을 수 없음"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청")
    })
    @PutMapping("/{noticeId}")
    public ResponseEntity<Void> update(
            @Parameter(description = "공지사항 ID", example = "1")
            @PathVariable("noticeId") Long id,
            @Parameter(description = "공지사항 수정 정보")
            @RequestBody NoticeUpdateReqDto dto) {
        dto.setId(id);
        noticeService.update(dto);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "공지사항 삭제", description = "특정 공지사항을 삭제합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "삭제 성공"),
            @ApiResponse(responseCode = "404", description = "공지사항을 찾을 수 없음")
    })
    @DeleteMapping("/{noticeId}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "공지사항 ID", example = "1")
            @PathVariable("noticeId") Long id) {
        noticeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}