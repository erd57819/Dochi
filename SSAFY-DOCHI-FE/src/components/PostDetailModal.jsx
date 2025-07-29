import React, { useState, useEffect } from 'react';
import { communityApi, commentApi, likeApi } from '../services/communityApi';

const PostDetailModal = ({ isOpen, onClose, postId }) => {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [error, setError] = useState(null);

  // 게시글과 댓글 데이터 로드
  useEffect(() => {
    if (isOpen && postId) {
      console.log('PostDetailModal: 게시글 로드 시작, postId:', postId);
      loadPostDetail();
    }
  }, [isOpen, postId]);

  const loadPostDetail = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('PostDetailModal: API 호출 시작, postId:', postId);
      
      // 게시글 정보 로드
      const postData = await communityApi.getPost(postId);
      console.log('PostDetailModal: 게시글 데이터 응답:', postData);
      setPost(postData);
      
      // 댓글 로드
      const commentsData = await commentApi.getComments(postId);
      console.log('PostDetailModal: 댓글 데이터 응답:', commentsData);
      setComments(commentsData);
      
    } catch (error) {
      console.error('PostDetailModal: 데이터 로드 실패:', error);
      setError(error.message);
      alert('게시글을 불러오는데 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 게시글 좋아요 토글
  const handlePostLike = async (likeType) => {
    try {
      console.log('PostDetailModal: 게시글 좋아요 처리, postId:', postId, 'likeType:', likeType);
      const result = await likeApi.togglePostLike(postId, likeType);
      console.log('PostDetailModal: 좋아요 처리 결과:', result);
      
      // 게시글 좋아요 정보 업데이트
      setPost(prev => ({
        ...prev,
        likeCount: result.likeCount,
        dislikeCount: result.dislikeCount,
        userLikeType: result.userLikeType
      }));

    } catch (error) {
      console.error('PostDetailModal: 게시글 좋아요 처리 실패:', error);
      alert('좋아요 처리에 실패했습니다: ' + error.message);
    }
  };

  // 댓글 작성
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    setIsSubmittingComment(true);
    
    try {
      console.log('PostDetailModal: 댓글 작성, postId:', postId, 'content:', commentText);
      await commentApi.createComment(postId, commentText);
      setCommentText('');
      
      // 댓글 목록 새로고침
      const updatedComments = await commentApi.getComments(postId);
      setComments(updatedComments);
      
      console.log('PostDetailModal: 댓글 작성 성공');
    } catch (error) {
      console.error('PostDetailModal: 댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다: ' + error.message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 댓글 좋아요 토글
  const handleCommentLike = async (commentId, likeType) => {
    try {
      console.log('PostDetailModal: 댓글 좋아요 처리, commentId:', commentId, 'likeType:', likeType);
      const result = await likeApi.toggleCommentLike(commentId, likeType);
      
      // 댓글 좋아요 정보 업데이트
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? {
                ...comment,
                likeCount: result.likeCount,
                dislikeCount: result.dislikeCount,
                userLikeType: result.userLikeType
              }
            : comment
        )
      );

      console.log('PostDetailModal: 댓글 좋아요 처리 성공:', result);
    } catch (error) {
      console.error('PostDetailModal: 댓글 좋아요 처리 실패:', error);
      alert('댓글 좋아요 처리에 실패했습니다: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🦔</div>
            <p className="text-gray-600">게시글을 불러오는 중...</p>
            <p className="text-sm text-gray-500 mt-2">PostID: {postId}</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">❌</div>
            <p className="text-red-600 mb-2">오류가 발생했습니다</p>
            <p className="text-sm text-gray-600">{error}</p>
            <p className="text-xs text-gray-500 mt-2">PostID: {postId}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              닫기
            </button>
          </div>
        ) : post ? (
          <>
            {/* 헤더 */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">게시글 상세보기</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* 게시글 내용 */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                  {post.category || 'GENERAL'}
                </span>
                <span className="text-sm text-gray-500">{post.author || '익명'}</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-500">{post.createdAt || '방금 전'}</span>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{post.title}</h3>
              <div className="text-gray-700 mb-6 whitespace-pre-wrap">{post.content}</div>
              
              {/* 게시글 좋아요 */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handlePostLike('LIKE')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                    post.userLikeType === 'LIKE'
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  👍 {post.likeCount || 0}
                </button>
                <button
                  onClick={() => handlePostLike('DISLIKE')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                    post.userLikeType === 'DISLIKE'
                      ? 'bg-red-100 text-red-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  👎 {post.dislikeCount || 0}
                </button>
              </div>
            </div>

            {/* 댓글 작성 */}
            <div className="p-6 border-b">
              <h4 className="font-semibold text-gray-800 mb-3">댓글 작성</h4>
              <form onSubmit={handleCommentSubmit}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  disabled={isSubmittingComment}
                />
                <div className="flex justify-end mt-3">
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400"
                  >
                    {isSubmittingComment ? '작성 중...' : '댓글 작성'}
                  </button>
                </div>
              </form>
            </div>

            {/* 댓글 목록 */}
            <div className="p-6">
              <h4 className="font-semibold text-gray-800 mb-4">
                댓글 ({comments.length})
              </h4>
              
              {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-800">{comment.author || '익명'}</span>
                        <span className="text-sm text-gray-500">{comment.createdAt || '방금 전'}</span>
                      </div>
                      
                      <p className="text-gray-700 mb-3 whitespace-pre-wrap">{comment.content}</p>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCommentLike(comment.id, 'LIKE')}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                            comment.userLikeType === 'LIKE'
                              ? 'bg-orange-100 text-orange-600'
                              : 'text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          👍 {comment.likeCount || 0}
                        </button>
                        <button
                          onClick={() => handleCommentLike(comment.id, 'DISLIKE')}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                            comment.userLikeType === 'DISLIKE'
                              ? 'bg-red-100 text-red-600'
                              : 'text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          👎 {comment.dislikeCount || 0}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">❓</div>
            <p className="text-gray-600">게시글을 찾을 수 없습니다.</p>
            <p className="text-sm text-gray-500 mt-2">PostID: {postId}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetailModal;