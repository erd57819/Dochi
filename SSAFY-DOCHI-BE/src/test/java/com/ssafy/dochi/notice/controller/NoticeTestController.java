package com.ssafy.dochi.notice.controller;

import com.ssafy.dochi.common.template.ApiResponse;
import com.ssafy.dochi.common.template.ApiResponseGenerator;
import com.ssafy.dochi.notice.dto.request.NoticeSaveReqDto;
import com.ssafy.dochi.notice.service.NoticeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/notices/test")
@RequiredArgsConstructor
@Tag(name = "Notice Test", description = "공지사항 테스트용 API (개발용)")
public class NoticeTestController {

    private final NoticeService noticeService;

    @Operation(summary = "테스트 데이터 생성", description = "테스트용 공지사항 데이터를 생성합니다.")
    @PostMapping("/create-dummy")
    public ApiResponse<ApiResponse.SuccessCustomBody<Void>> createDummyData() {

        // 일반 공지사항
        NoticeSaveReqDto notice1 = new NoticeSaveReqDto();
        notice1.setTitle("참견도치 서비스 오픈 안내");
        notice1.setContent("안녕하세요. 갈등 해결 플랫폼 참견도치가 정식 오픈되었습니다. 많은 이용 부탁드립니다.");
        notice1.setCategory("announcement");
        notice1.setIsImportant(false);
        notice1.setIsPopup(false);
        notice1.setPublishDate(LocalDateTime.now());

        // 중요 공지사항
        NoticeSaveReqDto notice2 = new NoticeSaveReqDto();
        notice2.setTitle("시스템 점검 안내");
        notice2.setContent("2024년 1월 15일 오후 2시부터 4시까지 시스템 점검으로 인해 서비스 이용이 제한됩니다.");
        notice2.setCategory("system");
        notice2.setIsImportant(true);
        notice2.setIsPopup(true);
        notice2.setPublishDate(LocalDateTime.now());
        notice2.setExpireDate(LocalDateTime.now().plusDays(30));

        // 업데이트 공지
        NoticeSaveReqDto notice3 = new NoticeSaveReqDto();
        notice3.setTitle("새로운 기능 업데이트");
        notice3.setContent("AI 감정 분석 기능이 더욱 정확해졌습니다. 새로운 기능을 체험해보세요!");
        notice3.setCategory("update");
        notice3.setIsImportant(false);
        notice3.setIsPopup(false);
        notice3.setPublishDate(LocalDateTime.now());

        // 임시 사용자 ID (실제로는 인증된 사용자 ID 사용)
        Long dummyUserId = 1L;

        noticeService.save(notice1, dummyUserId);
        noticeService.save(notice2, dummyUserId);
        noticeService.save(notice3, dummyUserId);

        return ApiResponseGenerator.success(HttpStatus.CREATED);
    }
}