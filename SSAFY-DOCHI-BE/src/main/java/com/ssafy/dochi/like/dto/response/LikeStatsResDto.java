package com.ssafy.dochi.like.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 좋아요 통계 응답 DTO
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LikeStatsResDto {

    private Long targetId;              // 게시글 ID 또는 댓글 ID
    private Integer likeCount;          // 좋아요 개수
    private Integer dislikeCount;       // 싫어요 개수
    private String userLikeType;        // 현재 사용자의 좋아요 상태 ("LIKE", "DISLIKE", null)
    private Boolean hasUserLiked;       // 사용자가 좋아요/싫어요를 눌렀는지 여부
}
