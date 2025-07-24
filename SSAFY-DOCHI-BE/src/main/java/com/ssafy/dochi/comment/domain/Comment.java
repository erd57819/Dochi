package com.ssafy.dochi.comment.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * NOTE: comments 테이블과 매핑되는 도메인 객체입니다.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Comment {

    private Long id;
    private Long postId;                    // post_id (FK) - community_posts 테이블 참조
    private Long userId;                    // user_id (FK) - users 테이블 참조
    private Long parentCommentId;           // parent_comment_id (대댓글용)
    private String content;                 // 댓글 내용
    private LocalDateTime createdAt;        // created_at
    private LocalDateTime updatedAt;        // updated_at
    private LocalDateTime deletedAt;        // deleted_at (Soft Delete)
    
    // 추가 필드 (JOIN 시 사용)
    private String userName;                // 작성자 이름 (users.name)
    private String userProfileImage;        // 작성자 프로필 이미지 (users.profile_image)
    
    // 댓글인지 대댓글인지 확인하는 메서드
    public boolean isReply() {
        return parentCommentId != null;
    }
    
    // 삭제되었는지 확인하는 메서드
    public boolean isDeleted() {
        return deletedAt != null;
    }
}
