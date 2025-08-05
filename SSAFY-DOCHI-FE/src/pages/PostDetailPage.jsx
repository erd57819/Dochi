import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { communityApi, commentApi, likeApi } from '../services/communityApi';
import useAuthStore from '../stores/AuthStore';

const PostDetailPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [error, setError] = useState(null);

  const categories = {
    'GENERAL': '자유게시판',
    'CONFLICT_SHARING': '갈등공유',
    'SUCCESS_STORIES': '성공사례',
    'ADVICE_REQUEST': '조언요청'
  };

  // 데이터 로드
  useEffect(() => {
    if (postId) {
      loadPostDetail();
    }
  }, [postId]);

  const loadPostDetail = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 게시글 정보 로드
      const postData = await communityApi.getPost(postId);
      setPost(postData);
      
      // 댓글 로드
      const commentsData = await commentApi.getComments(postId);
      setComments(commentsData);
      
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 게시글 좋아요 처리
  const handlePostLike = async (likeType) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const result = await likeApi.togglePostLike(postId, likeType);
      setPost(prev => ({
        ...prev,
        likeCount: result.likeCount,
        dislikeCount: result.dislikeCount,
        userLikeType: result.userLikeType
      }));
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  // 댓글 작성
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    if (!commentText.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    setIsSubmittingComment(true);
    
    try {
      await commentApi.createComment(postId, commentText);
      setCommentText('');
      
      // 댓글 목록 새로고침
      const updatedComments = await commentApi.getComments(postId);
      setComments(updatedComments);
      
      alert('댓글이 작성되었습니다.');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 댓글 좋아요 처리
  const handleCommentLike = async (commentId, likeType) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const result = await likeApi.toggleCommentLike(commentId, likeType);
      
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
    } catch (error) {
      console.error('댓글 좋아요 처리 실패:', error);
      alert('댓글 좋아요 처리에 실패했습니다.');
    }
  };

  // 게시글 삭제
  const handleDeletePost = async () => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await communityApi.deletePost(postId);
      alert('게시글이 삭제되었습니다.');
      navigate('/community');
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert(error.message || '게시글 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🦔</div>
            <p className="text-gray-600">게시글을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">게시글을 찾을 수 없습니다</h2>
            <p className="text-gray-600 mb-4">{error || '존재하지 않는 게시글입니다.'}</p>
            <Link 
              to="/community"
              className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              커뮤니티로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 상단 네비게이션 */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-orange-500">홈</Link>
            <span>›</span>
            <Link to="/community" className="hover:text-orange-500">커뮤니티</Link>
            <span>›</span>
            <span className="text-gray-800">{categories[post.category] || '게시글'}</span>
          </nav>
        </div>

        {/* 게시글 헤더 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="bg-orange-100 text-orange-700 text-sm px-3 py-1 rounded-full font-medium">
                {categories[post.category] || post.category}
              </span>
              <div className="text-sm text-gray-500">
                <span className="font-medium">{post.author || '익명'}</span>
                <span className="mx-2">•</span>
                <span>{post.createdAt || '방금 전'}</span>
                <span className="mx-2">•</span>
                <span>조회 {post.viewCount || 0}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/community')}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                목록으로
              </button>
              {isLoggedIn && user && (post.userId === user.id || user.role === 'ADMIN') && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/community/edit/${postId}`)}
                    className="px-4 py-2 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    수정
                  </button>
                  <button 
                    onClick={handleDeletePost}
                    className="px-4 py-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{post.title}</h1>
          
          {/* 게시글 좋아요 */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handlePostLike('LIKE')}
              disabled={!isLoggedIn}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                !isLoggedIn 
                  ? 'text-gray-300 cursor-not-allowed'
                  : post.userLikeType === 'LIKE'
                  ? 'bg-orange-100 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">👍</span>
              <span className="font-medium">{post.likeCount || 0}</span>
            </button>
            
            <button
              onClick={() => handlePostLike('DISLIKE')}
              disabled={!isLoggedIn}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                !isLoggedIn 
                  ? 'text-gray-300 cursor-not-allowed'
                  : post.userLikeType === 'DISLIKE'
                  ? 'bg-red-100 text-red-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">👎</span>
              <span className="font-medium">{post.dislikeCount || 0}</span>
            </button>
            
            <div className="flex items-center gap-2 text-gray-500 ml-auto">
              <span className="text-lg">💬</span>
              <span className="font-medium">{comments.length}</span>
            </div>
          </div>
        </div>

        {/* 게시글 내용 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="prose max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
              {post.content}
            </div>
          </div>
        </div>

        {/* 댓글 작성 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">💬 댓글 작성</h3>
          {isLoggedIn ? (
            <form onSubmit={handleCommentSubmit}>
              <div className="mb-4">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400 resize-none"
                  disabled={isSubmittingComment}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {commentText.length}/500자
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 font-medium"
                >
                  {isSubmittingComment ? '작성 중...' : '댓글 작성'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">댓글을 작성하려면 로그인이 필요합니다.</p>
              <Link 
                to="/login"
                className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                로그인하기
              </Link>
            </div>
          )}
        </div>

        {/* 댓글 목록 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            💬 댓글 ({comments.length})
          </h3>
          
          {comments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">💭</div>
              <p>아직 댓글이 없습니다.</p>
              <p className="text-sm mt-1">첫 댓글을 작성해보세요!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment, index) => (
                <div key={comment.id} className="border-b border-gray-100 last:border-b-0 pb-6 last:pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-orange-600">
                          {(comment.author || '익명').charAt(0)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">{comment.author || '익명'}</span>
                        <span className="text-sm text-gray-500 ml-2">{comment.createdAt || '방금 전'}</span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">#{index + 1}</span>
                  </div>
                  
                  <div className="text-gray-700 mb-3 pl-11 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                  
                  <div className="flex items-center gap-2 pl-11">
                    <button
                      onClick={() => handleCommentLike(comment.id, 'LIKE')}
                      disabled={!isLoggedIn}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                        !isLoggedIn 
                          ? 'text-gray-300 cursor-not-allowed'
                          : comment.userLikeType === 'LIKE'
                          ? 'bg-orange-100 text-orange-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      👍 {comment.likeCount || 0}
                    </button>
                    <button
                      onClick={() => handleCommentLike(comment.id, 'DISLIKE')}
                      disabled={!isLoggedIn}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                        !isLoggedIn 
                          ? 'text-gray-300 cursor-not-allowed'
                          : comment.userLikeType === 'DISLIKE'
                          ? 'bg-red-100 text-red-600'
                          : 'text-gray-600 hover:bg-gray-100'
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

        {/* 하단 네비게이션 */}
        <div className="mt-8 flex justify-center">
          <Link 
            to="/community"
            className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;