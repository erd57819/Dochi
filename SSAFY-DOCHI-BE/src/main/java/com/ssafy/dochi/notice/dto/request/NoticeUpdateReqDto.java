package com.ssafy.dochi.notice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.ssafy.dochi.notice.domain.Notice.NoticeCategory;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "공지사항 수정 요청 DTO")
public class NoticeUpdateReqDto {

    @Schema(description = "공지사항 ID", hidden = true)
    private Long id;

    @Schema(description = "공지사항 제목", example = "시스템 점검 안내 (수정)", required = true)
    private String title;

    @Schema(description = "공지사항 내용", example = "점검 시간이 변경되었습니다. 오전 3시부터 5시까지입니다.", required = true)
    private String content;

    @Schema(description = "공지사항 카테고리", example = "MAINTENANCE", allowableValues = {"SYSTEM", "UPDATE", "MAINTENANCE", "ANNOUNCEMENT"})
    private NoticeCategory category;

    @Schema(description = "중요 공지 여부", example = "true")
    private Boolean isImportant;

    @Schema(description = "팝업 노출 여부", example = "false")
    private Boolean isPopup;
}