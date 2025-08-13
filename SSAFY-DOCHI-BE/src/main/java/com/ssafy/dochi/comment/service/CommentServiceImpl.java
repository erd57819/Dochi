package com.ssafy.dochi.comment.service;

import com.ssafy.dochi.comment.dao.CommentDao;
import com.ssafy.dochi.comment.domain.Comment;
import com.ssafy.dochi.comment.dto.request.CommentSaveReqDto;
import com.ssafy.dochi.comment.dto.request.CommentUpdateReqDto;
import com.ssafy.dochi.comment.dto.response.CommentResDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 댓글 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentServiceImpl implements CommentService {

    private final CommentDao commentDao;

    @Override
    @Transactional
    public Long saveComment(CommentSaveReqDto commentSaveReqDto) {
        log.info("댓글 등록 요청: postId={}, userId={}, parentCommentId={}", 
                commentSaveReqDto.getPostId(), 
                commentSaveReqDto.getUserId(), 
                commentSaveReqDto.getParentCommentId());

        // 대댓글인 경우 부모 댓글 존재 확인
        if (commentSaveReqDto.getParentCommentId() != null) {
            CommentResDto parentComment = commentDao.findById(commentSaveReqDto.getParentCommentId());
            if (parentComment == null) {
                throw new IllegalArgumentException("존재하지 않는 부모 댓글입니다.");
            }
        }

        Comment comment = Comment.builder()
                .postId(commentSaveReqDto.getPostId())
                .userId(commentSaveReqDto.getUserId())
                .parentCommentId(commentSaveReqDto.getParentCommentId())
                .content(commentSaveReqDto.getContent())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        int result = commentDao.insert(comment);
        if (result == 0) {
            throw new RuntimeException("댓글 등록에 실패했습니다.");
        }

        // 게시글의 댓글 수 업데이트
        updatePostCommentCount(commentSaveReqDto.getPostId());

        log.info("댓글 등록 완료: commentId={}", comment.getId());
        return comment.getId();
    }

    @Override
    @Transactional
    public void updateComment(CommentUpdateReqDto commentUpdateReqDto) {
        log.info("댓글 수정 요청: commentId={}, userId={}", 
                commentUpdateReqDto.getId(), 
                commentUpdateReqDto.getUserId());

        // 기존 댓글 조회 및 권한 확인
        CommentResDto existingComment = commentDao.findById(commentUpdateReqDto.getId());
        if (existingComment == null) {
            throw new IllegalArgumentException("존재하지 않는 댓글입니다.");
        }
        
        if (!existingComment.getUserId().equals(commentUpdateReqDto.getUserId())) {
            throw new IllegalArgumentException("댓글 수정 권한이 없습니다.");
        }

        Comment comment = Comment.builder()
                .id(commentUpdateReqDto.getId())
                .content(commentUpdateReqDto.getContent())
                .updatedAt(LocalDateTime.now())
                .build();

        int result = commentDao.update(comment);
        if (result == 0) {
            throw new RuntimeException("댓글 수정에 실패했습니다.");
        }

        log.info("댓글 수정 완료: commentId={}", commentUpdateReqDto.getId());
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        log.info("댓글 삭제 요청: commentId={}, userId={}", commentId, userId);

        // 기존 댓글 조회 및 권한 확인
        CommentResDto existingComment = commentDao.findById(commentId);
        if (existingComment == null) {
            throw new IllegalArgumentException("존재하지 않는 댓글입니다.");
        }
        
        if (!existingComment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("댓글 삭제 권한이 없습니다.");
        }

        // 부모 댓글인 경우 (parent_comment_id가 null) 대댓글들도 함께 삭제
        if (existingComment.getParentCommentId() == null) {
            log.info("부모 댓글 삭제 - 대댓글들도 함께 삭제: commentId={}", commentId);
            commentDao.deleteRepliesByParentId(commentId);
        }

        int result = commentDao.hardDelete(commentId, userId);
        if (result == 0) {
            throw new RuntimeException("댓글 삭제에 실패했습니다.");
        }

        // 게시글의 댓글 수 업데이트
        updatePostCommentCount(existingComment.getPostId());

        log.info("댓글 삭제 완료: commentId={}", commentId);
    }

    @Override
    public List<CommentResDto> getCommentsByPostId(Long postId) {
        log.info("게시글 댓글 목록 조회: postId={}", postId);

        // 부모 댓글들 조회
        List<CommentResDto> parentComments = commentDao.findByPostId(postId);
        
        // 각 부모 댓글에 대댓글 추가
        for (CommentResDto parentComment : parentComments) {
            List<CommentResDto> replies = commentDao.findRepliesByParentId(parentComment.getId());
            parentComment.setReplies(replies);
            parentComment.setReplyCount(replies.size());
        }

        return parentComments;
    }

    @Override
    public CommentResDto getCommentById(Long commentId) {
        log.info("댓글 상세 조회: commentId={}", commentId);
        
        CommentResDto comment = commentDao.findById(commentId);
        if (comment == null) {
            throw new IllegalArgumentException("존재하지 않는 댓글입니다.");
        }
        
        return comment;
    }

    @Override
    public List<CommentResDto> getCommentsByUserId(Long userId, int page, int size) {
        log.info("사용자 댓글 목록 조회: userId={}, page={}, size={}", userId, page, size);
        
        int offset = (page - 1) * size;
        return commentDao.findByUserId(userId, offset, size);
    }

    @Override
    public int getCommentCountByUserId(Long userId) {
        return commentDao.getCommentCountByUserId(userId);
    }

    /**
     * 게시글의 댓글 수 업데이트
     */
    private void updatePostCommentCount(Long postId) {
        int commentCount = commentDao.getCommentCountByPostId(postId);
        commentDao.updatePostCommentCount(postId, commentCount);
    }
}
