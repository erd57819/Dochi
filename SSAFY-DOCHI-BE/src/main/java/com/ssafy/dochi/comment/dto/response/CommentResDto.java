package com.ssafy.dochi.comment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 댓글 목록 응답 DTO (대댓글 포함)
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommentResDto {

    private Long id;
    private Long postId;
    private Long userId;
    private Long parentCommentId;
    private String content;
    private String userName;
    private String userProfileImage;
    private String createdAt;
    private String updatedAt;
    private Boolean isDeleted;
    
    // 대댓글 목록 (계층형 구조)
    private List<CommentResDto> replies;
    
    // 대댓글 개수
    private Integer replyCount;
}
