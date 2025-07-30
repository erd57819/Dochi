package com.ssafy.dochi.community.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CommunityResDto {
    private Long id;
    private Long userId;
    private String author;
    private String category;
    private String title;
    private String content;
    private Integer viewCount;
    private Integer commentCount;
    private String tags;
    private String createdAt;
    private String updatedAt;
}
