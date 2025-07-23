package com.ssafy.dochi.notice.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NoticeInfoResDto {
    private Long id;
    private String title;
    private String content;
    private Long userId;
    private String category;
    private Boolean isImportant;
    private Boolean isPopup;
    private Integer viewCount;
    private String publishDate;
    private String expireDate;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
}