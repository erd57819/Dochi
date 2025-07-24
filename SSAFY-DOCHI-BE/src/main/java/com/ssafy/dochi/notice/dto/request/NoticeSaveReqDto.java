package com.ssafy.dochi.notice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import com.ssafy.dochi.notice.domain.Notice.NoticeCategory;

@Getter
@NoArgsConstructor
@Schema(description = "공지사항 작성 요청 DTO")
public class NoticeSaveReqDto {

    @Schema(description = "공지사항 제목", example = "시스템 점검 안내", required = true)
    private String title;

    @Schema(description = "공지사항 내용", example = "내일 오전 2시부터 4시까지 시스템 점검이 있습니다.", required = true)
    private String content;

    @Schema(description = "공지사항 카테고리", example = "ANNOUNCEMENT", allowableValues = {"SYSTEM", "UPDATE", "MAINTENANCE", "ANNOUNCEMENT"})
    private NoticeCategory category = NoticeCategory.ANNOUNCEMENT;

    @Schema(description = "중요 공지 여부", example = "false")
    private Boolean isImportant = false;

    @Schema(description = "팝업 노출 여부", example = "false")
    private Boolean isPopup = false;
}