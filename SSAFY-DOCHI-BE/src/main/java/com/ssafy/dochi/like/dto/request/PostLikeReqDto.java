package com.ssafy.dochi.like.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.constraints.NotNull;

/**
 * 게시글 좋아요/싫어요 요청 DTO
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PostLikeReqDto {

    @NotNull(message = "게시글 ID는 필수입니다.")
    private Long postId;

    @NotNull(message = "사용자 ID는 필수입니다.")
    private Long userId;

    @NotNull(message = "좋아요 타입은 필수입니다.")
    private String likeType; // "LIKE" 또는 "DISLIKE"
}
