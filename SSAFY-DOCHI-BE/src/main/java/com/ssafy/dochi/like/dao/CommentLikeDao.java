package com.ssafy.dochi.like.dao;

import com.ssafy.dochi.like.domain.CommentLike;
import com.ssafy.dochi.like.dto.response.LikeStatsResDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 댓글 좋아요 데이터 접근 객체
 */
@Mapper
public interface CommentLikeDao {

    /**
     * 댓글 좋아요/싫어요 등록 또는 수정
     */
    int insertOrUpdate(CommentLike commentLike);

    /**
     * 댓글 좋아요/싫어요 삭제 (같은 타입을 다시 눌렀을 때)
     */
    int delete(@Param("commentId") Long commentId, @Param("userId") Long userId);

    /**
     * 사용자의 댓글 좋아요 상태 조회
     */
    CommentLike findByCommentIdAndUserId(@Param("commentId") Long commentId, @Param("userId") Long userId);

    /**
     * 댓글 좋아요 통계 조회
     */
    LikeStatsResDto getLikeStats(@Param("commentId") Long commentId, @Param("userId") Long userId);

    /**
     * 댓글의 좋아요 개수 조회
     */
    int getLikeCount(@Param("commentId") Long commentId);

    /**
     * 댓글의 싫어요 개수 조회
     */
    int getDislikeCount(@Param("commentId") Long commentId);
}
