package com.ssafy.dochi.community.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CommunityInfoResDto {
    private Long id;
    private Long userId;
    private String category;
    private String title;
    private String content;
    private Integer viewCount;
    private Integer commentCount;
    private String tags;
    private String createdAt;
    private String updatedAt;
}