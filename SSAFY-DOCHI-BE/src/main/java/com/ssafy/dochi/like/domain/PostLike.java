package com.ssafy.dochi.like.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * NOTE: post_likes 테이블과 매핑되는 도메인 객체입니다.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PostLike {

    private Long id;
    private Long postId;                    // post_id (FK) - community_posts 테이블 참조
    private Long userId;                    // user_id (FK) - users 테이블 참조
    private LikeType likeType;              // like_type ENUM('LIKE', 'DISLIKE')
    private LocalDateTime createdAt;        // created_at

    // 좋아요 타입 ENUM
    public enum LikeType {
        LIKE, DISLIKE
    }
}
