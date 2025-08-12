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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const categories = {
    'GENERAL': { label: '자유게시판', color: '#7F5539' },
    'CONFLICT_SHARING': { label: '갈등공유', color: '#cd9f6e' },
    'SUCCESS_STORIES': { label: '성공사례', color: '#f8d6b3' },
    'ADVICE_REQUEST': { label: '조언요청', color: '#EE9278' }
  };

  // 작성자 닉네임 또는 이름 표시 함수
  const getDisplayName = (item) => {
    // 삭제된 사용자인 경우
    if (!item.author && !item.authorNickname) {
      return '탈퇴한 회원';
    }
    // 닉네임이 있으면 닉네임을, 없으면 이름을 표시
    return item.authorNickname || item.author || '익명';
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
      setEditTitle(postData.title);
      setEditContent(postData.content);
      setEditCategory(postData.category);
      
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

    console.log('=== 게시글 좋아요 디버깅 ===');
    console.log('user 객체 전체:', user);
    console.log('user.id:', user?.id);
    console.log('postId:', postId);
    console.log('likeType:', likeType);
    console.log('====================');

    try {
      const result = await likeApi.togglePostLike(postId, user.id, likeType);
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

  // 게시글 삭제
  const handleDeletePost = async () => {
    const confirmMessage = `게시글 "${post.title}"을 정말로 삭제하시겠습니까?\n\n삭제된 게시글은 복구할 수 없습니다.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await communityApi.deletePost(postId);
      alert('게시글이 삭제되었습니다.');
      navigate('/community');
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  // 게시글 수정 모드 토글
  const handleEditPost = () => {
    setIsEditMode(true);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategory(post.category);
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategory(post.category);
  };

  // 게시글 수정 저장
  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!editContent.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setIsUpdating(true);
    try {
      const updatedPost = await communityApi.updatePost(postId, {
        title: editTitle,
        content: editContent,
        category: editCategory
      });
      
      setPost(updatedPost);
      setIsEditMode(false);
      alert('게시글이 수정되었습니다.');
    } catch (error) {
      console.error('게시글 수정 실패:', error);
      alert('게시글 수정에 실패했습니다.');
    } finally {
      setIsUpdating(false);
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
      
      // alert('댓글이 작성되었습니다.');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 댓글 좋아요 처리 (수정됨)
  const handleCommentLike = async (commentId, likeType) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    console.log('=== 댓글 좋아요 디버깅 ===');
    console.log('user 객체 전체:', user);
    console.log('user.id:', user?.id);
    console.log('commentId:', commentId);
    console.log('likeType:', likeType);
    console.log('====================');

    try {
      const result = await likeApi.toggleCommentLike(commentId, user.id, likeType);
      
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
        
        <main className="max-w-3xl mx-auto px-2 py-6 relative z-10">
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
  const postDisplayName = getDisplayName(post);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative" style={{ minHeight: '100vh' }}>
      {/* 전체 배경 컨테이너 */}
      <div className="absolute inset-0 w-full" style={{ minHeight: '100vh' }}>
        {/* 상단 배경 */}
        <div 
          className="absolute top-0 left-0 w-full bg-gradient-to-br from-orange-50 via-white to-yellow-50" 
          style={{ 
            opacity: 0.14,
            minHeight: '100vh',
            height: '100%'
          }}
        ></div>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="max-w-3xl mx-auto px-2 py-4 relative z-10">
        {/* 헤더 */}
        <div className="flex items-center mb-4">
          <div>
            <div className="flex items-center gap-2">
              <img src={hedgehogImg} alt="갈등도치" className="w-8 h-8 object-contain" />
              <h3 className="text-xl font-bold" style={{ color: '#8B4513' }}>게시글 상세보기</h3>
            </div>
            
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm mt-2" style={{ color: '#666666' }}>
              <Link to="/" className="hover:opacity-70 transition-opacity" style={{ color: '#8B4513' }}>홈</Link>
              <span>›</span>
              <Link to="/community" className="hover:opacity-70 transition-opacity" style={{ color: '#8B4513' }}>커뮤니티</Link>
              <span>›</span>
              <span>{categoryData.label}</span>
            </nav>
          </div>

        </div>

        <div className="space-y-4">
          {/* 게시글 헤더 카드 */}
          <div className="bg-white rounded p-5 ">
            <div className="flex items-center gap-4 mb-">
              <div className="flex-1">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-xl font-bold pb-3 mb-2 w-full px-3 py-2 border-2 rounded-lg focus:outline-none"
                    style={{ 
                      color: '#333333',
                      borderColor: '#F0F0F0'
                    }}
                    placeholder="제목을 입력하세요"
                  />
                ) : (
                  <h2 className="text-xl font-bold pb-3" style={{ color: '#333333' }}>
                    {post.title}
                  </h2>
                )}
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-3" style={{ color: '#666666' }}>
                    {isEditMode ? (
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="text-xs px-3 py-1 rounded-full font-medium border-2"
                        style={{ borderColor: '#F0F0F0' }}
                      >
                        <option value="GENERAL">자유게시판</option>
                        <option value="CONFLICT_SHARING">갈등공유</option>
                        <option value="SUCCESS_STORIES">성공사례</option>
                        <option value="ADVICE_REQUEST">조언요청</option>
                      </select>
                    ) : (
                      <span 
                        className="text-white text-xs px-2 py-1 rounded font-medium"
                        style={{ backgroundColor: categoryData.color }}
                      >
                        {categoryData.label}
                      </span>
                    )}
                    <span className="text-sm">조회수 {post.viewCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#666666' }}>
                    <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ 
                          backgroundColor: postDisplayName === '탈퇴한 회원' ? '#CCCCCC' : '#F8D6B3'
                        }}
                    >
                      <span 
                        className="text-xs font-medium" 
                        style={{ 
                          color: postDisplayName === '탈퇴한 회원' ? '#666666' : '#8B4513'
                        }}
                      >
                        {postDisplayName.charAt(0)}
                      </span>
                    </div>
                    <span 
                      className="font-medium text-sm"
                      style={{
                        color: postDisplayName === '탈퇴한 회원' ? '#999999' : '#666666'
                      }}
                    >
                      {postDisplayName}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{post.createdAt || '방금 전'}</span>
                  </div>
                </div>
              </div>
            </div>

          {/* 게시글 내용 */}
          <div className="rounded p-3">
            <div 
              className="pl-2 py-3 min-h-40"
              style={{ borderColor: categoryData.color }}
            >
              {isEditMode ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full text-base leading-relaxed px-3 py-2 border-2 rounded-lg focus:outline-none resize-none"
                  style={{ 
                    color: '#333333',
                    borderColor: '#F0F0F0',
                    minHeight: '200px'
                  }}
                  placeholder="내용을 입력하세요"
                  rows={10}
                />
              ) : (
                <div 
                  className="text-base leading-relaxed whitespace-pre-wrap"
                  style={{ color: '#333333' }}
                >
                  {post.content}
                </div>
              )}
            </div>
            
            {/* 목록으로, 수정, 삭제 버튼 */}
            <div className="flex items-center justify-between ml-3 pt-2">
              {/* 목록으로 버튼 - 왼쪽 */}
              <Link 
                to="/community"
                className="text-black text-sm hover:text-gray-600 transition-colors"
              >
                ← 목록으로
              </Link>
              
              {/* 수정 삭제 버튼 - 오른쪽 */}
              <div className="flex gap-3">
              {isLoggedIn && user && (post.userId === user.id || user.role === 'ADMIN') && (
                  isEditMode ? (
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-3">
                        <button 
                          onClick={handleSaveEdit}
                          disabled={isUpdating}
                          className="px-3 py-1 rounded font-medium transition-all hover:-translate-y-1 disabled:opacity-50 text-sm"
                          style={{ 
                            backgroundColor: '#CD9F6E',
                            color: '#FFFFFF'
                          }}
                        >
                          {isUpdating ? '저장 중...' : '저장'}
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          className="px-3 py-1 rounded font-medium transition-all hover:-translate-y-1 disabled:opacity-50 text-sm"
                          style={{ 
                            backgroundColor: '#999999',
                            color: '#FFFFFF'
                          }}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={handleEditPost}
                        className="px-3 py-1 rounded font-medium transition-all hover:-translate-y-1 text-sm"
                        style={{ 
                          backgroundColor: '#cd9f6e',
                          color: '#FFFFFF'
                        }}
                      >
                        수정
                      </button>
                      <button 
                        onClick={handleDeletePost}
                        className="px-3 py-1 rounded font-medium transition-all hover:-translate-y-1 text-sm"
                        style={{ 
                          backgroundColor: '#7F5539',
                          color: '#FFFFFF'
                        }}
                      >
                        삭제
                      </button>
                    </>
                  )
              )}
              </div>
            </div>
          </div>
          {/* 좋아요/싫어요 통합 바 - 수정 모드에서는 숨김 */}
          {!isEditMode && (
          <div className="w-full mt-4">
            {(() => {
              const likeCount = Number(post?.likeCount ?? 0);
              const dislikeCount = Number(post?.dislikeCount ?? 0);
              const total = likeCount + dislikeCount;

              const likePercent = total === 0 ? 50 : (likeCount / total) * 100;
              const dislikePercent = total === 0 ? 50 : (dislikeCount / total) * 100;

              return (
                <div>
                  {/* 비율 바 제목 */}
                  <div className='flex justify-center mb-3'>
                    <p
                      className="text-lg font-bold mb-2 bg-[linear-gradient(108deg,rgba(255,177,32,1)_0%,rgba(191,125,44,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]"
                    >
                      긍정 부정 비율이 그래프로 표시됩니다
                    </p>
                  </div>

                  {/* 추천/비추천 버튼 */}
                  <div className="flex justify-center gap-8 mb-4">
                    {/* 추천 버튼 */}
                    <button
                      onClick={() => isLoggedIn && handlePostLike('LIKE')}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                        !isLoggedIn ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      }`}
                      disabled={!isLoggedIn}
                      style={{
                        backgroundColor: post.userLikeType === 'LIKE' ? 'rgba(255,177,32,0.8)' : 'transparent',
                        border: '1px solid rgba(255,177,32,0.5)'
                      }}
                    >
                      <img
                        src={thumbUp}
                        alt="추천"
                        className="w-8 h-8"
                      />
                    </button>
                    
                    {/* 비추천 버튼 */}
                    <button
                      onClick={() => isLoggedIn && handlePostLike('DISLIKE')}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                        !isLoggedIn ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      }`}
                      disabled={!isLoggedIn}
                      style={{
                        backgroundColor: post.userLikeType === 'DISLIKE' ? 'rgba(191,125,44,0.8)' : 'transparent',
                        border: '1px solid rgba(191,125,44,0.5)'
                      }}
                    >
                      <img
                        src={thumbDown}
                        alt="비추천"
                        className="w-8 h-8"
                      />
                    </button>
                  </div>

                  {/* 비율 바 */}
                  <div className="w-full bg-gray-200 rounded h-6 overflow-hidden flex">
                    {/* 추천 영역 */}
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        flexBasis: `${likePercent}%`,
                        background: `linear-gradient(90deg, rgba(255,177,32,1) 0%, rgba(255,177,32,1) 80%, rgba(223,151,38,1) 100%)`
                      }}
                    />
                    {/* 비추천 영역 */}
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        flexBasis: `${dislikePercent}%`,
                        background: `linear-gradient(90deg, rgba(223,151,38,1) 0%, rgba(191,125,44,1) 20%, rgba(191,125,44,1) 100%)`
                      }}
                    />
                  </div>

                  {/* 비율 텍스트 */}
                  <div className="flex justify-between mt-2 text-sm font-bold text-gray-600">
                    {/* 왼쪽: 좋아요 */}
                    <div className="flex items-center gap-2">
                      <span>좋아요 {likePercent.toFixed(1)}%</span>
                      <span className="text-[rgba(223,151,38,1)]"> {likeCount}표</span>
                    </div>

                    {/* 오른쪽: 싫어요 */}
                    <div className="flex items-center gap-2">
                      <span className="text-[rgba(191,125,44,1)]">{dislikeCount}표</span>
                      <span>싫어요 {dislikePercent.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          )}
          </div>
          

          {/* 댓글 목록 */}
          <div className="bg-white rounded p-5">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-bold" style={{ color: '#333333' }}>
                댓글 ({comments.length})
              </h3>
            </div>
            
            {isLoggedIn ? (
              <form onSubmit={handleCommentSubmit}>
                <div className="mb-4">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="건설적이고 따뜻한 댓글을 작성해주세요..."
                    rows={3}
                    className="w-full h-20 px-3 py-2 border-2 rounded focus:outline-none text-sm placeholder-gray-400 resize-none transition-all"
                    style={{ 
                      borderColor: '#F0F0F0',
                      focusBorderColor: categoryData.color,
                      color: '#5c5c5cff',
                      backgroundColor: '#F8F8F8'
                    }}
                    disabled={isSubmittingComment}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm" style={{ color: '#666666' }}>
                      {commentText.length}/500자
                    </p>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingComment || !commentText.trim()}
                        className="px-3 py-1 rounded font-medium transition-all hover:-translate-y-1 disabled:opacity-50 disabled:transform-none text-sm"
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
              <div className="text-center py-8 rounded-xl" style={{ backgroundColor: '#F8F8F8' }}>
                <div className="text-2xl mb-3">🔒</div>
                <p className="text-base mb-4" style={{ color: '#666666' }}>댓글을 작성하려면 로그인이 필요합니다.</p>
                <Link 
                  to="/login"
                  className="px-5 py-2 text-white rounded-lg hover:opacity-90 transition-all transform hover:-translate-y-1 font-medium text-sm"
                  style={{ backgroundColor: '#8B4513' }}
                >
                  로그인하기
                </Link>
              </div>
            )}

            {comments.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-3">💭</div>
                <h4 className="text-lg font-bold mb-2" style={{ color: '#333333' }}>
                  아직 댓글이 없습니다
                </h4>
                <p className="text-sm" style={{ color: '#666666' }}>
                  첫 댓글을 작성해보세요!
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {comments.map((comment, index) => {
                  const commentDisplayName = getDisplayName(comment);
                  
                  return (
                    <div 
                      key={comment.id} 
                      className="pl-4 py-3"
                      style={{ borderColor: categoryData.color }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-7 h-7 rounded-full flex items-center justify-center"
                            style={{ 
                              backgroundColor: commentDisplayName === '탈퇴한 회원' ? '#CCCCCC' : '#F8D6B3'
                            }}
                          >
                            <span 
                              className="font-medium" 
                              style={{ 
                                color: commentDisplayName === '탈퇴한 회원' ? '#666666' : '#8B4513'
                              }}
                            >
                              {commentDisplayName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <span 
                              className="font-bold text-sm" 
                              style={{ 
                                color: commentDisplayName === '탈퇴한 회원' ? '#999999' : '#333333'
                              }}
                            >
                              {commentDisplayName}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm mr-3" style={{ color: '#666666' }}>
                            {comment.createdAt || '방금 전'}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full" style={{ 
                            backgroundColor: '#F8D6B3',
                            color: '#8B4513'
                          }}>
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm mb-3 leading-relaxed whitespace-pre-wrap" style={{ color: '#333333' }}>
                        {comment.content}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleCommentLike(comment.id, 'LIKE')}
                          disabled={!isLoggedIn}
                          className={`flex items-center gap-2 transition-all text-sm font-medium ${
                              !isLoggedIn
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : comment.userLikeType === 'LIKE'
                                      ? 'cursor-pointer'
                                      : 'text-gray-500 cursor-pointer'
                          }`}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            padding: '0',
                            color: !isLoggedIn 
                              ? '#d1d5db' 
                              : comment.userLikeType === 'LIKE' 
                                ? 'rgba(255,177,32,1)' 
                                : '#6b7280'
                          }}
                          onMouseEnter={(e) => {
                            if (isLoggedIn && comment.userLikeType !== 'LIKE') {
                              e.target.style.color = 'rgba(255,177,32,0.7)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (isLoggedIn && comment.userLikeType !== 'LIKE') {
                              e.target.style.color = '#6b7280';
                            }
                          }}
                        >
                          <img src={thumbUp} alt="따봉" className="w-5 h-5" /> {comment.likeCount || 0}
                        </button>
                        <button
                          onClick={() => handleCommentLike(comment.id, 'DISLIKE')}
                          disabled={!isLoggedIn}
                          className={`flex items-center gap-2 transition-all text-sm font-medium ${
                              !isLoggedIn
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : comment.userLikeType === 'DISLIKE'
                                      ? 'cursor-pointer'
                                      : 'text-gray-500 cursor-pointer'
                          }`}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            padding: '0',
                            color: !isLoggedIn 
                              ? '#d1d5db' 
                              : comment.userLikeType === 'DISLIKE' 
                                ? 'rgba(191,125,44,1)' 
                                : '#6b7280'
                          }}
                          onMouseEnter={(e) => {
                            if (isLoggedIn && comment.userLikeType !== 'DISLIKE') {
                              e.target.style.color = 'rgba(191,125,44,0.7)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (isLoggedIn && comment.userLikeType !== 'DISLIKE') {
                              e.target.style.color = '#6b7280';
                            }
                          }}
                        >
                          <img src={thumbDown} alt="안따봉" className="w-5 h-5" /> {comment.dislikeCount || 0}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostDetailPage;