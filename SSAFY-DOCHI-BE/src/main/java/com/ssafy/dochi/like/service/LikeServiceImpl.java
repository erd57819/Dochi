package com.ssafy.dochi.like.service;

import com.ssafy.dochi.like.dao.CommentLikeDao;
import com.ssafy.dochi.like.dao.PostLikeDao;
import com.ssafy.dochi.like.domain.CommentLike;
import com.ssafy.dochi.like.domain.PostLike;
import com.ssafy.dochi.like.dto.request.CommentLikeReqDto;
import com.ssafy.dochi.like.dto.request.PostLikeReqDto;
import com.ssafy.dochi.like.dto.response.LikeStatsResDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 좋아요 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LikeServiceImpl implements LikeService {

    private final PostLikeDao postLikeDao;
    private final CommentLikeDao commentLikeDao;

    @Override
    @Transactional
    public LikeStatsResDto togglePostLike(PostLikeReqDto postLikeReqDto) {
        log.info("게시글 좋아요 토글 요청: postId={}, userId={}, likeType={}", 
                postLikeReqDto.getPostId(), 
                postLikeReqDto.getUserId(), 
                postLikeReqDto.getLikeType());

        Long postId = postLikeReqDto.getPostId();
        Long userId = postLikeReqDto.getUserId();
        PostLike.LikeType newLikeType = PostLike.LikeType.valueOf(postLikeReqDto.getLikeType());

        // 기존 좋아요 상태 확인
        PostLike existingLike = postLikeDao.findByPostIdAndUserId(postId, userId);

        if (existingLike == null) {
            // 첫 번째 좋아요/싫어요 등록
            PostLike postLike = PostLike.builder()
                    .postId(postId)
                    .userId(userId)
                    .likeType(newLikeType)
                    .createdAt(LocalDateTime.now())
                    .build();

            int result = postLikeDao.insertOrUpdate(postLike);
            if (result == 0) {
                throw new RuntimeException("게시글 좋아요 등록에 실패했습니다.");
            }
            log.info("게시글 좋아요 등록 완료: postId={}, userId={}, likeType={}", postId, userId, newLikeType);

        } else if (existingLike.getLikeType() == newLikeType) {
            // 같은 타입을 다시 눌렀을 때 - 취소
            int result = postLikeDao.delete(postId, userId);
            if (result == 0) {
                throw new RuntimeException("게시글 좋아요 취소에 실패했습니다.");
            }
            log.info("게시글 좋아요 취소 완료: postId={}, userId={}", postId, userId);

        } else {
            // 다른 타입으로 변경
            PostLike postLike = PostLike.builder()
                    .postId(postId)
                    .userId(userId)
                    .likeType(newLikeType)
                    .createdAt(LocalDateTime.now())
                    .build();

            int result = postLikeDao.insertOrUpdate(postLike);
            if (result == 0) {
                throw new RuntimeException("게시글 좋아요 변경에 실패했습니다.");
            }
            log.info("게시글 좋아요 변경 완료: postId={}, userId={}, {} -> {}", 
                    postId, userId, existingLike.getLikeType(), newLikeType);
        }

        // 최신 통계 반환
        return getPostLikeStats(postId, userId);
    }

    @Override
    @Transactional
    public LikeStatsResDto toggleCommentLike(CommentLikeReqDto commentLikeReqDto) {
        log.info("댓글 좋아요 토글 요청: commentId={}, userId={}, likeType={}", 
                commentLikeReqDto.getCommentId(), 
                commentLikeReqDto.getUserId(), 
                commentLikeReqDto.getLikeType());

        Long commentId = commentLikeReqDto.getCommentId();
        Long userId = commentLikeReqDto.getUserId();
        CommentLike.LikeType newLikeType = CommentLike.LikeType.valueOf(commentLikeReqDto.getLikeType());

        // 기존 좋아요 상태 확인
        CommentLike existingLike = commentLikeDao.findByCommentIdAndUserId(commentId, userId);

        if (existingLike == null) {
            // 첫 번째 좋아요/싫어요 등록
            CommentLike commentLike = CommentLike.builder()
                    .commentId(commentId)
                    .userId(userId)
                    .likeType(newLikeType)
                    .createdAt(LocalDateTime.now())
                    .build();

            int result = commentLikeDao.insertOrUpdate(commentLike);
            if (result == 0) {
                throw new RuntimeException("댓글 좋아요 등록에 실패했습니다.");
            }
            log.info("댓글 좋아요 등록 완료: commentId={}, userId={}, likeType={}", commentId, userId, newLikeType);

        } else if (existingLike.getLikeType() == newLikeType) {
            // 같은 타입을 다시 눌렀을 때 - 취소
            int result = commentLikeDao.delete(commentId, userId);
            if (result == 0) {
                throw new RuntimeException("댓글 좋아요 취소에 실패했습니다.");
            }
            log.info("댓글 좋아요 취소 완료: commentId={}, userId={}", commentId, userId);

        } else {
            // 다른 타입으로 변경
            CommentLike commentLike = CommentLike.builder()
                    .commentId(commentId)
                    .userId(userId)
                    .likeType(newLikeType)
                    .createdAt(LocalDateTime.now())
                    .build();

            int result = commentLikeDao.insertOrUpdate(commentLike);
            if (result == 0) {
                throw new RuntimeException("댓글 좋아요 변경에 실패했습니다.");
            }
            log.info("댓글 좋아요 변경 완료: commentId={}, userId={}, {} -> {}", 
                    commentId, userId, existingLike.getLikeType(), newLikeType);
        }

        // 최신 통계 반환
        return getCommentLikeStats(commentId, userId);
    }

    @Override
    public LikeStatsResDto getPostLikeStats(Long postId, Long userId) {
        LikeStatsResDto stats = postLikeDao.getLikeStats(postId, userId);
        if (stats == null) {
            stats = LikeStatsResDto.builder()
                    .targetId(postId)
                    .likeCount(0)
                    .dislikeCount(0)
                    .userLikeType(null)
                    .hasUserLiked(false)
                    .build();
        }
        return stats;
    }

    @Override
    public LikeStatsResDto getCommentLikeStats(Long commentId, Long userId) {
        LikeStatsResDto stats = commentLikeDao.getLikeStats(commentId, userId);
        if (stats == null) {
            stats = LikeStatsResDto.builder()
                    .targetId(commentId)
                    .likeCount(0)
                    .dislikeCount(0)
                    .userLikeType(null)
                    .hasUserLiked(false)
                    .build();
        }
        return stats;
    }
}
