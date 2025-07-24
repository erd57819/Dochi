package com.ssafy.dochi.community.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CommunityResDto {
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