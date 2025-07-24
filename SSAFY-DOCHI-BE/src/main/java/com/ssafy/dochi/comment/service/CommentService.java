package com.ssafy.dochi.comment.service;

import com.ssafy.dochi.comment.dto.request.CommentSaveReqDto;
import com.ssafy.dochi.comment.dto.request.CommentUpdateReqDto;
import com.ssafy.dochi.comment.dto.response.CommentResDto;

import java.util.List;

/**
 * 댓글 서비스 인터페이스
 */
public interface CommentService {

    /**
     * 댓글 등록
     */
    Long saveComment(CommentSaveReqDto commentSaveReqDto);

    /**
     * 댓글 수정
     */
    void updateComment(CommentUpdateReqDto commentUpdateReqDto);

    /**
     * 댓글 삭제
     */
    void deleteComment(Long commentId, Long userId);

    /**
     * 게시글의 댓글 목록 조회 (계층형 구조)
     */
    List<CommentResDto> getCommentsByPostId(Long postId);

    /**
     * 댓글 상세 조회
     */
    CommentResDto getCommentById(Long commentId);

    /**
     * 사용자의 댓글 목록 조회 (페이징)
     */
    List<CommentResDto> getCommentsByUserId(Long userId, int page, int size);

    /**
     * 사용자의 댓글 총 개수
     */
    int getCommentCountByUserId(Long userId);
}
