package com.ssafy.dochi.like.service;

import com.ssafy.dochi.like.dto.request.CommentLikeReqDto;
import com.ssafy.dochi.like.dto.request.PostLikeReqDto;
import com.ssafy.dochi.like.dto.response.LikeStatsResDto;

/**
 * 좋아요 서비스 인터페이스
 */
public interface LikeService {

    /**
     * 게시글 좋아요/싫어요 토글
     */
    LikeStatsResDto togglePostLike(PostLikeReqDto postLikeReqDto);

    /**
     * 댓글 좋아요/싫어요 토글
     */
    LikeStatsResDto toggleCommentLike(CommentLikeReqDto commentLikeReqDto);

    /**
     * 게시글 좋아요 통계 조회
     */
    LikeStatsResDto getPostLikeStats(Long postId, Long userId);

    /**
     * 댓글 좋아요 통계 조회
     */
    LikeStatsResDto getCommentLikeStats(Long commentId, Long userId);
}
