package com.ssafy.dochi.comment.dao;

import com.ssafy.dochi.comment.domain.Comment;
import com.ssafy.dochi.comment.dto.response.CommentResDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 댓글 데이터 접근 객체
 */
@Mapper
public interface CommentDao {

    /**
     * 댓글 등록
     */
    int insert(Comment comment);

    /**
     * 댓글 수정
     */
    int update(Comment comment);

    /**
     * 댓글 소프트 삭제
     */
    int softDelete(@Param("id") Long id, @Param("userId") Long userId);

    /**
     * 댓글 ID로 조회
     */
    CommentResDto findById(@Param("id") Long id);

    /**
     * 게시글의 모든 댓글 조회 (대댓글 제외)
     */
    List<CommentResDto> findByPostId(@Param("postId") Long postId);

    /**
     * 특정 댓글의 대댓글 조회
     */
    List<CommentResDto> findRepliesByParentId(@Param("parentCommentId") Long parentCommentId);

    /**
     * 게시글의 댓글 총 개수 (삭제되지 않은 것만)
     */
    int getCommentCountByPostId(@Param("postId") Long postId);

    /**
     * 게시글의 댓글 수 업데이트 (community_posts 테이블)
     */
    int updatePostCommentCount(@Param("postId") Long postId, @Param("count") int count);

    /**
     * 사용자의 댓글 목록 조회 (마이페이지용)
     */
    List<CommentResDto> findByUserId(@Param("userId") Long userId, @Param("offset") int offset, @Param("limit") int limit);

    /**
     * 사용자의 댓글 총 개수
     */
    int getCommentCountByUserId(@Param("userId") Long userId);
}
