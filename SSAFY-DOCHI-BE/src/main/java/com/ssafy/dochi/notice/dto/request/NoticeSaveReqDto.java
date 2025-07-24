package com.ssafy.dochi.notice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "공지사항 작성 요청 DTO")
public class NoticeSaveReqDto {

    @Schema(description = "공지사항 제목", example = "중요한 시스템 업데이트 안내", required = true)
    private String title;

    @Schema(description = "공지사항 내용", example = "2024년 1월 1일 오후 2시부터 4시까지 시스템 점검이 있을 예정입니다.", required = true)
    private String content;

    @Schema(description = "공지사항 카테고리", example = "system",
            allowableValues = {"system", "update", "maintenance", "announcement"})
    private String category;

    @Schema(description = "중요 공지 여부", example = "true")
    private Boolean isImportant = false;

    @Schema(description = "팝업 표시 여부", example = "false")
    private Boolean isPopup = false;

    @Schema(description = "게시 시작 일시", example = "2024-01-01T09:00:00")
    private LocalDateTime publishDate;

    @Schema(description = "게시 종료 일시", example = "2024-12-31T23:59:59")
    private LocalDateTime expireDate;
}