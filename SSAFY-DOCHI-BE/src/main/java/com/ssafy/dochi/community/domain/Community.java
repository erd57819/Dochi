package com.ssafy.dochi.community.domain;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * NOTE: community_posts 테이블과 매핑되는 도메인 객체입니다.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Community {

    private Long id;
    private Long userId;
    private String category;
    private String title;
    private String content;
    private Integer viewCount;
    private Integer commentCount;
    private String tags; // NOTE: JSON 타입이므로 우선 String으로 처리합니다.
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}