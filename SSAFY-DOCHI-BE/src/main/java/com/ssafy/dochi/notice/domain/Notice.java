package com.ssafy.dochi.notice.domain;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Notice {

    private Long id;
    private Long userId;  // users 테이블의 mno와 연결
    private String title;
    private String content;
    private String category; // system, update, maintenance, announcement
    private Boolean isImportant;
    private Boolean isPopup;
    private Integer viewCount;
    private LocalDateTime publishDate;
    private LocalDateTime expireDate;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}