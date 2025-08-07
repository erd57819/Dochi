import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { communityApi, commentApi, likeApi } from '../services/communityApi';
import useAuthStore from '../stores/AuthStore';
import hedgehogImg from '../assets/image-21.png'; // 도치 이미지 추가
import thumbUp from '@/assets/thumb_up.png';
import thumbDown from '@/assets/thumb_down.png';

const PostDetailPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();

  // 뒤로가기 핸들러
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [error, setError] = useState(null);

  const categories = {
    'GENERAL': { label: '자유게시판', color: '#7F5539' },
    'CONFLICT_SHARING': { label: '갈등공유', color: '#cd9f6e' },
    'SUCCESS_STORIES': { label: '성공사례', color: '#f8d6b3' },
    'ADVICE_REQUEST': { label: '조언요청', color: '#EE9278' }
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

  if (loading) {
    return (
      <div className="min-h-screen relative">
        {/* 배경 */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-0 left-0 w-full" 
            style={{ 
              height: '100%',
              backgroundColor: '#F8D6B3',
              opacity: 0.14
            }}
          ></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <img src={hedgehogImg} alt="갈등도치" className="w-16 h-16 mx-auto mb-4 animate-bounce" />
            <p className="text-xl" style={{ color: '#8B4513' }}>게시글을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen relative ">
        {/* 배경 */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-0 left-0 w-full" 
            style={{ 
              height: '100%',
              backgroundColor: '#F8D6B3',
              opacity: 0.14
            }}
          ></div>
        </div>
        
        <main className="max-w-4xl mx-auto px-4 py-12 relative z-10">
          <div className="bg-white rounded-3xl p-8 text-center">
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#333333' }}>게시글을 찾을 수 없습니다</h2>
            <p className="text-xl mb-8" style={{ color: '#666666' }}>{error || '존재하지 않는 게시글입니다.'}</p>
            <Link 
              to="/community"
              className="px-8 py-4 text-white rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 font-medium text-lg"
              style={{ backgroundColor: '#8B4513' }}
            >
              커뮤니티로 돌아가기
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const categoryData = categories[post.category] || { label: '게시글', color: '#8B4513' };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* 전체 배경 컨테이너 */}
      <div className="absolute inset-0">
        {/* 상단 배경 */}
        <div 
          className="absolute top-0 left-0 w-full bg-gradient-to-br from-orange-50 via-white to-yellow-50" 
          style={{ 
            height: '100%',
            // backgroundColor: '#F8D6B3',
            opacity: 0.14
          }}
        ></div>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="max-w-5xl mx-auto px-4 py-12 relative z-10">
        {/* 헤더 */}
        <div className="flex items-center mb-8">
          <div className="flex items-center gap-3">
            <img src={hedgehogImg} alt="갈등도치" className="w-12 h-12 rounded-full" />
            <h3 className="text-3xl font-bold" style={{ color: '#8B4513' }}>게시글 상세보기</h3>
            <button 
              onClick={handleGoBack}
              className="text-2xl mr-4 hover:opacity-70 transition-opacity"
              style={{ border: '1px solid #e7c6afff' }}
            >
              ←
          </button>
          </div>
          {/* 브레드크럼 */}
          <div className="ml-auto">
            <nav className="flex items-center gap-2 text-lg" style={{ color: '#666666' }}>
              <Link to="/" className="hover:opacity-70 transition-opacity" style={{ color: '#8B4513' }}>홈</Link>
              <span>›</span>
              <Link to="/community" className="hover:opacity-70 transition-opacity" style={{ color: '#8B4513' }}>커뮤니티</Link>
              <span>›</span>
              <span>{categoryData.label}</span>
            </nav>
          </div>
        </div>



        <div className="space-y-6">
          {/* 게시글 헤더 카드 */}
          <div className="bg-white rounded p-10 ">
            <div className="flex items-center gap-4 mb-">
              <div className="flex-1">
                <h2 className="text-3xl font-bold pb-5" style={{ color: '#333333' }}>
                  {post.title}
                </h2>
                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-4" style={{ color: '#666666' }}>
                    <span 
                      className="text-sm px-4 py-1 rounded-full font-medium text-white"
                      style={{ backgroundColor: categoryData.color }}
                    >
                      {categoryData.label}
                    </span>
                    <span>👁 {post.viewCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-2" style={{ color: '#666666' }}>
                    <span className="font-medium">{post.author || '익명'} 도치</span>
                    <span className="text-gray-400">•</span>
                    <span>{post.createdAt || '방금 전'}</span>
                  </div>
                </div>
              </div>
            </div>

          {/* 게시글 내용 */}
          <div className="rounded p-4">
            <div 
              className="pl-2 py-5 min-h-90"
              style={{ borderColor: categoryData.color }}
            >
              <div 
                className="text-lg leading-relaxed whitespace-pre-wrap"
                style={{ color: '#333333' }}
              >
                {post.content}
              </div>
            </div>
            
          </div>
            <div className="border-t-2 border-yellow-800 flex items-center justify-end pt-6">

              {/* 게시글 상호작용 */}
              <div className="flex items-center gap-4" style={{ borderColor: '#F0F0F0' }}>
                <div className="text-center">
                  <p className="my-5 font text-2xl font-bold">난 네편이야</p>
                  <button
                    onClick={() => handlePostLike('LIKE')}
                    disabled={!isLoggedIn}
                    className={`w-50 h-30 flex items-center justify-center gap-2 px-6 py-3 rounded font-medium transition-all transform hover:scale-102 hover:opacity-80 ${
                      !isLoggedIn 
                        ? 'cursor-not-allowed'
                        : ''
                    }`}
                    style={{
                      backgroundColor: !isLoggedIn
                          ? 'transparent'
                          : post.userLikeType === 'LIKE'
                              ? '#ff93a5ff'
                              : '#ffe4e4ff',
                      color: !isLoggedIn
                          ? '#cccccc'
                          : post.userLikeType === 'LIKE'
                              ? '#FFFFFF'
                              : '#8B4513'
                    }}
                  >
                    <span className="text-xl"><img src={thumbUp} alt="따봉" className="w-8 h-8" /></span>
                    <span className="font-bold">{post.likeCount || 0}</span>
                  </button>
                </div>
                  
                <div className="text-center">
                  <p className="my-5 font text-2xl font-bold">너가 잘못했어</p>
                  <button
                    onClick={() => handlePostLike('DISLIKE')}
                    disabled={!isLoggedIn}
                    className={`w-50 h-30 flex items-center justify-center gap-2 px-6 py-3 rounded font-medium transition-all transform hover:scale-102 hover:opacity-80 ${
                      !isLoggedIn 
                        ? 'cursor-not-allowed'
                        : ''
                    }`}
                    style={{
                      backgroundColor: !isLoggedIn
                          ? 'transparent'
                          : post.userLikeType === 'DISLIKE'
                              ? '#93d7ffff'
                              : '#e4f5ffff',
                      color: !isLoggedIn
                          ? '#cccccc'
                          : post.userLikeType === 'DISLIKE'
                              ? '#FFFFFF'
                              : '#666666'
                    }}
                  >
                    <span className="text-xl"><img src={thumbDown} alt="안따봉" className="w-8 h-8" /></span>
                    <span className="font-bold">{post.dislikeCount || 0}</span>
                  </button>
                </div>
              </div>

              <img src={hedgehogImg} alt="갈등도치" className="w-30  ml-17 mr-10 mt-15 rounded-full" />
            </div>
            {/* 액션 버튼 */}
              <div className="flex items-center justify-end ml-4 pt-5 gap-2">
                {isLoggedIn && user && (post.userId === user.id || user.role === 'ADMIN') && (
                  <div className="flex gap-3">
                    <button 
                      className="px-4 py-2 rounded font-medium transition-all hover:-translate-y-1"
                      style={{ 
                        backgroundColor: '#cd9f6e',
                        color: '#FFFFFF'
                      }}
                    >
                      수정
                    </button>
                    <button 
                      className="px-4 py-2 rounded font-medium transition-all hover:-translate-y-1"
                      style={{ 
                        backgroundColor: '#7F5539',
                        color: '#FFFFFF'
                      }}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
          </div>
          

          {/* 댓글 목록 */}
          <div className="bg-white rounded p-10">
            <div className="flex items-center gap-4 mb-5">
              <h3 className="text-2xl font-bold" style={{ color: '#333333' }}>
                댓글 ({comments.length})
              </h3>
            </div>
            
            {isLoggedIn ? (
              <form onSubmit={handleCommentSubmit}>
                <div className="mb-6">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="건설적이고 따뜻한 댓글을 작성해주세요..."
                    rows={5}
                    className="w-full h-30 px-6 py-4 border-2 rounded focus:outline-none text-lg placeholder-gray-400 resize-none transition-all"
                    style={{ 
                      borderColor: '#F0F0F0',
                      focusBorderColor: categoryData.color
                    }}
                    disabled={isSubmittingComment}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm" style={{ color: '#666666' }}>
                      {commentText.length}/500자
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setCommentText('')}
                        className="px-4 py-2 rounded-lg font-medium transition-all"
                        style={{ 
                          backgroundColor: '#F0F0F0',
                          color: '#666666'
                        }}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingComment || !commentText.trim()}
                        className="px-8 py-3 rounded-xl font-medium transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
                        style={{ 
                          backgroundColor: categoryData.color,
                          color: '#FFFFFF'
                        }}
                      >
                        {isSubmittingComment ? '작성 중...' : '댓글 작성'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: '#F8F8F8' }}>
                <div className="text-4xl mb-4">🔒</div>
                <p className="text-xl mb-6" style={{ color: '#666666' }}>댓글을 작성하려면 로그인이 필요합니다.</p>
                <Link 
                  to="/login"
                  className="px-8 py-4 text-white rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-1 font-medium text-lg"
                  style={{ backgroundColor: '#8B4513' }}
                >
                  로그인하기
                </Link>
              </div>
            )}

            {comments.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-6">💭</div>
                <h4 className="text-2xl font-bold mb-4" style={{ color: '#333333' }}>
                  아직 댓글이 없습니다
                </h4>
                <p className="text-lg" style={{ color: '#666666' }}>
                  첫 댓글을 작성해보세요!
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {comments.map((comment, index) => (
                  <div 
                    key={comment.id} 
                    className="pl-8 py-4"
                    style={{ borderColor: categoryData.color }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#F8D6B3' }}
                        >
                          <span className="font-medium" style={{ color: '#8B4513' }}>
                            {(comment.author || '익명').charAt(0)}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-lg" style={{ color: '#333333' }}>
                            {comment.author || '익명'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm mr-3" style={{ color: '#666666' }}>
                          {comment.createdAt || '방금 전'}
                        </span>
                        <span className="text-sm px-3 py-1 rounded-full" style={{ 
                          backgroundColor: '#F8D6B3',
                          color: '#8B4513'
                        }}>
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-lg mb-4 leading-relaxed whitespace-pre-wrap" style={{ color: '#333333' }}>
                      {comment.content}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCommentLike(comment.id, 'LIKE')}
                        disabled={!isLoggedIn}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                          !isLoggedIn ? 'cursor-not-allowed' : 'transform hover:-translate-y-1 '
                        }`}
                        style={{
                          backgroundColor: !isLoggedIn 
                            ? '#E5E5E5'
                            : comment.userLikeType === 'LIKE'
                            ? '#BF7D2C'
                            : '#F8D6B3',
                          color: !isLoggedIn 
                            ? '#999999'
                            : comment.userLikeType === 'LIKE'
                            ? '#FFFFFF'
                            : '#8B4513'
                        }}
                      >
                        👍 {comment.likeCount || 0}
                      </button>
                      <button
                        onClick={() => handleCommentLike(comment.id, 'DISLIKE')}
                        disabled={!isLoggedIn}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                          !isLoggedIn ? 'cursor-not-allowed' : 'transform hover:-translate-y-1 '
                        }`}
                        style={{
                          backgroundColor: !isLoggedIn 
                            ? '#E5E5E5'
                            : comment.userLikeType === 'DISLIKE'
                            ? '#7F5539'
                            : '#F0F0F0',
                          color: !isLoggedIn 
                            ? '#999999'
                            : comment.userLikeType === 'DISLIKE'
                            ? '#FFFFFF'
                            : '#666666'
                        }}
                      >
                        👎 {comment.dislikeCount || 0}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="text-left mt-12">
          <Link 
            to="/community"
            className="px-8 py-4 text-white rounded-xl hover:opacity-90 transition-all transform hover:-translate-y-1 font-medium text-lg mr-4"
            style={{ backgroundColor: '#8B4513' }}
          >
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PostDetailPage;