package com.ssafy.dochi.like.dao;

import com.ssafy.dochi.like.domain.PostLike;
import com.ssafy.dochi.like.dto.response.LikeStatsResDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 게시글 좋아요 데이터 접근 객체
 */
@Mapper
public interface PostLikeDao {

    /**
     * 게시글 좋아요/싫어요 등록 또는 수정
     */
    int insertOrUpdate(PostLike postLike);

    /**
     * 게시글 좋아요/싫어요 삭제 (같은 타입을 다시 눌렀을 때)
     */
    int delete(@Param("postId") Long postId, @Param("userId") Long userId);

    /**
     * 사용자의 게시글 좋아요 상태 조회
     */
    PostLike findByPostIdAndUserId(@Param("postId") Long postId, @Param("userId") Long userId);

    /**
     * 게시글 좋아요 통계 조회
     */
    LikeStatsResDto getLikeStats(@Param("postId") Long postId, @Param("userId") Long userId);

    /**
     * 게시글의 좋아요 개수 조회
     */
    int getLikeCount(@Param("postId") Long postId);

    /**
     * 게시글의 싫어요 개수 조회
     */
    int getDislikeCount(@Param("postId") Long postId);
}
