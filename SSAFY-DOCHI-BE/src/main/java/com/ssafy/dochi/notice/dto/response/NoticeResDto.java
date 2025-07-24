package com.ssafy.dochi.notice.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import com.ssafy.dochi.notice.domain.Notice.NoticeCategory;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "공지사항 목록 응답 DTO")
public class NoticeResDto {

    @Schema(description = "공지사항 ID", example = "1")
    private Long id;

    @Schema(description = "제목", example = "시스템 점검 안내")
    private String title;

    @Schema(description = "내용", example = "시스템 점검으로 인해...")
    private String content;

    @Schema(description = "작성자 ID", example = "1")
    private Long userId;

    @Schema(description = "카테고리", example = "ANNOUNCEMENT")
    private NoticeCategory category;

    @Schema(description = "중요 공지 여부", example = "false")
    private Boolean isImportant;

    @Schema(description = "팝업 노출 여부", example = "false")
    private Boolean isPopup;

    @Schema(description = "게시일", example = "2024-01-15 10:30:00")
    private String publishDate;

    @Schema(description = "생성일", example = "2024-01-15 10:30:00")
    private String createdAt;

    @Schema(description = "수정일", example = "2024-01-15 10:30:00")
    private String updatedAt;

    @Schema(description = "조회수", example = "15")
    private Integer viewCount;
}