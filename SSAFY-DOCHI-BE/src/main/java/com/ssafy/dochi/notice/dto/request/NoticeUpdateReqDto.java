package com.ssafy.dochi.notice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "공지사항 수정 요청 DTO")
public class NoticeUpdateReqDto {

    @Schema(description = "공지사항 ID", hidden = true)
    private Long id;

    @Schema(description = "공지사항 제목", example = "수정된 공지사항 제목")
    private String title;

    @Schema(description = "공지사항 내용", example = "수정된 공지사항 내용입니다.")
    private String content;

    @Schema(description = "공지사항 카테고리", example = "update",
            allowableValues = {"system", "update", "maintenance", "announcement"})
    private String category;

    @Schema(description = "중요 공지 여부", example = "false")
    private Boolean isImportant;

    @Schema(description = "팝업 표시 여부", example = "false")
    private Boolean isPopup;

    @Schema(description = "게시 시작 일시", example = "2024-01-01T09:00:00")
    private LocalDateTime publishDate;

    @Schema(description = "게시 종료 일시", example = "2024-12-31T23:59:59")
    private LocalDateTime expireDate;

    @Schema(description = "활성화 여부", example = "true")
    private Boolean isActive;
}