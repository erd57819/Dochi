import { API_BASE_URL } from '../config/api.js';
import useAuthStore from '../stores/AuthStore.js';

// 인증 헤더 생성
const getAuthHeaders = () => {
  // ✅ 올바른 토큰 키 (accessToken)
  const token = localStorage.getItem('accessToken') || useAuthStore.getState().token;
  console.log('🔐 사용 중인 토큰:', token ? '토큰 있음' : '토큰 없음');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// 현재 사용자 ID 조회
const getCurrentUserId = () => {
  const user = useAuthStore.getState().user;
  return user?.id || null;
};

// 날짜 포맷팅 함수
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR');
};

// 커뮤니티 API
export const communityApi = {
  // 게시글 목록 조회
  async getPosts(page = 0, size = 10, search = '', category = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        ...(search && { search }),
        ...(category && { category })
      });
      
      // ✅ 백엔드 매핑과 일치하도록 수정
      const response = await fetch(`${API_BASE_URL}/community?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      console.log('게시글 목록 API 응답:', data);
      
      if (!response.ok) {
        throw new Error(data.message || '게시글 조회 실패');
      }
      
      // 응답 데이터 구조 확인 및 변환
      const result = data.data || data;
      
      // 각 게시글에 대해 좋아요 통계 조회
      const postsWithLikes = await Promise.all(
        (result.content || []).map(async (post) => {
          try {
            const likeStats = await likeApi.getPostLikeStats(post.id);
            return {
              ...post,
              author: post.author || `사용자${post.userId}`,
              createdAt: formatDate(post.createdAt),
              tags: post.tags ? post.tags.split(',') : [], // 태그 문자열을 배열로 변환
              likeCount: likeStats.likeCount || 0,
              dislikeCount: likeStats.dislikeCount || 0,
              userLikeType: likeStats.userLikeType
            };
          } catch (error) {
            console.warn(`게시글 ${post.id} 좋아요 통계 로드 실패:`, error);
            return {
              ...post,
              author: post.author || `사용자${post.userId}`,
              createdAt: formatDate(post.createdAt),
              tags: post.tags ? post.tags.split(',') : [],
              likeCount: 0,
              dislikeCount: 0,
              userLikeType: null
            };
          }
        })
      );

      return {
        content: postsWithLikes,
        totalPages: result.totalPages || 0,
        totalElements: result.totalElements || 0,
        pageNumber: result.pageNumber || 0
      };
    } catch (error) {
      console.error('게시글 조회 에러:', error);
      throw error;
    }
  },

  // 게시글 상세 조회
  async getPost(postId) {
    try {
      console.log('API: 게시글 상세 조회 시작, postId:', postId);
      
      // ✅ 백엔드 매핑과 일치하도록 수정
      const url = `${API_BASE_URL}/community/${postId}`;
      console.log('API: 요청 URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API: 응답 상태:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('API: 응답 데이터 전체:', data);
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP Error: ${response.status}`);
      }
      
      // 백엔드 응답 구조에 맞게 수정
      const post = data.data || data;
      
      // 게시글 좋아요 통계 로드
      try {
        const likeStats = await likeApi.getPostLikeStats(postId);
        return {
          ...post,
          likeCount: likeStats.likeCount || 0,
          dislikeCount: likeStats.dislikeCount || 0,
          userLikeType: likeStats.userLikeType
        };
      } catch (error) {
        console.warn('게시글 좋아요 통계 로드 실패:', error);
        return {
          ...post,
          likeCount: 0,
          dislikeCount: 0,
          userLikeType: null
        };
      }
    } catch (error) {
      console.error('API: 게시글 상세 조회 에러:', error);
      throw error;
    }
  },

  // 게시글 삭제
  async deletePost(postId) {
    try {
      console.log('🗑️ 게시글 삭제 요청:', postId);
      
      const headers = getAuthHeaders();
      const url = `${API_BASE_URL}/community/${postId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: headers
      });

      console.log('📊 게시글 삭제 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.log('❌ 삭제 에러 응답 데이터:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.warn('에러 응답을 JSON으로 파싱할 수 없음:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('✅ 게시글 삭제 성공 응답:', data);
      
      return data;
    } catch (error) {
      console.error('❌ 게시글 삭제 에러:', error);
      throw error;
    }
  },

  // 게시글 수정
  async updatePost(postId, postData) {
    try {
      console.log('✏️ 게시글 수정 요청:', postId, postData);
      
      const headers = getAuthHeaders();
      const url = `${API_BASE_URL}/community/${postId}`;
      
      const requestBody = {
        title: postData.title,
        content: postData.content,
        category: postData.category || 'GENERAL'
      };
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      console.log('📊 게시글 수정 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.log('❌ 수정 에러 응답 데이터:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.warn('에러 응답을 JSON으로 파싱할 수 없음:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('✅ 게시글 수정 성공 응답:', data);
      
      return data;
    } catch (error) {
      console.error('❌ 게시글 수정 에러:', error);
      throw error;
    }
  },

  // 게시글 작성
  async createPost(postData) {
    try {
      console.log('🚀 게시글 작성 요청:', postData);
      console.log('🌐 API_BASE_URL:', API_BASE_URL);
      
      const headers = getAuthHeaders();
      console.log('🔑 인증 헤더:', headers);
      
      // ✅ 백엔드 매핑과 일치하도록 수정 (/community)
      const url = `${API_BASE_URL}/community`;
      console.log('📡 게시글 작성 URL:', url);
      
      const requestBody = {
        title: postData.title,
        content: postData.content,
        category: postData.category || 'GENERAL'
      };
      console.log('📝 요청 본문:', requestBody);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      console.log('📊 게시글 작성 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        // 응답이 JSON이 아닐 수 있으므로 안전하게 처리
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.log('❌ 에러 응답 데이터:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.warn('에러 응답을 JSON으로 파싱할 수 없음:', parseError);
          // 응답 본문을 텍스트로 읽어보기
          try {
            const errorText = await response.text();
            console.log('❌ 에러 응답 텍스트:', errorText);
            if (errorText) errorMessage = errorText;
          } catch (textError) {
            console.warn('에러 응답을 텍스트로도 읽을 수 없음:', textError);
          }
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('✅ 게시글 작성 성공 응답:', data);
      
      return data;
    } catch (error) {
      console.error('❌ 게시글 작성 에러:', error);
      // 네트워크 에러나 기타 에러 정보 추가
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      }
      throw error;
    }
  }
};

// 댓글 API
export const commentApi = {
  // 댓글 목록 조회
  async getComments(postId) {
    try {
      // ✅ 백엔드 매핑 확인 필요 (comments 컨트롤러가 있는지)
      const response = await fetch(`${API_BASE_URL}/comments/post/${postId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      console.log('댓글 목록 API 응답:', data);
      
      if (!response.ok) {
        throw new Error(data.message || '댓글 조회 실패');
      }
      
      const comments = data.data || [];
      
      // 각 댓글에 대해 좋아요 통계 조회
      const commentsWithLikes = await Promise.all(
        comments.map(async (comment) => {
          try {
            const likeStats = await likeApi.getCommentLikeStats(comment.id);
            return {
              ...comment,
              author: comment.userName || `사용자${comment.userId}`,
              createdAt: formatDate(comment.createdAt),
              likeCount: likeStats.likeCount || 0,
              dislikeCount: likeStats.dislikeCount || 0,
              userLikeType: likeStats.userLikeType
            };
          } catch (error) {
            console.warn(`댓글 ${comment.id} 좋아요 통계 로드 실패:`, error);
            return {
              ...comment,
              author: comment.userName || `사용자${comment.userId}`,
              createdAt: formatDate(comment.createdAt),
              likeCount: 0,
              dislikeCount: 0,
              userLikeType: null
            };
          }
        })
      );
      
      return commentsWithLikes;
    } catch (error) {
      console.error('댓글 조회 에러:', error);
      throw error;
    }
  },

  // 댓글 작성
  async createComment(postId, content) {
    try {
      // ✅ 백엔드 매핑 확인 필요
      const response = await fetch(`${API_BASE_URL}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          postId: postId,
          userId: getCurrentUserId(),
          content: content
        })
      });

      const data = await response.json();
      
      console.log('댓글 작성 API 응답:', data);
      
      if (!response.ok) {
        throw new Error(data.message || '댓글 작성 실패');
      }
      
      return data;
    } catch (error) {
      console.error('댓글 작성 에러:', error);
      throw error;
    }
  }
};

// 좋아요 API
export const likeApi = {
  // 게시글 좋아요 토글
  async togglePostLike(postId, userId, likeType) {
    try {
      // 🔍 디버깅 로그 추가
      console.log('=== API 요청 디버깅 ===');
      console.log('받은 파라미터 - postId:', postId);
      console.log('받은 파라미터 - userId:', userId);
      console.log('받은 파라미터 - likeType:', likeType);
      
      const requestBody = {
        postId: postId,
        userId: userId,
        likeType: likeType
      };
      console.log('실제 전송 데이터:', requestBody);
      console.log('=====================');
      
      // 🔑 인증 헤더 확인
      const headers = getAuthHeaders();
      console.log('인증 헤더:', headers);
      
      console.log('👍 좋아요 요청 데이터:', { postId, userId, likeType });
      const response = await fetch(`${API_BASE_URL}/likes/posts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          postId: postId,
          userId: userId,
          likeType: likeType
        })
      });

      const data = await response.json();
      
      console.log('게시글 좋아요 API 응답:', data);
      
      if (!response.ok) {
        throw new Error(data.message || '좋아요 처리 실패');
      }
      
      return data.data || data;
    } catch (error) {
      console.error('게시글 좋아요 에러:', error);
      throw error;
    }
  },

  // 댓글 좋아요 토글
  async toggleCommentLike(commentId, likeType) {
    try {
      // ✅ 올바른 엔드포인트
      const response = await fetch(`${API_BASE_URL}/likes/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          commentId: commentId,
          userId: getCurrentUserId(),
          likeType: likeType
        })
      });

      const data = await response.json();
      
      console.log('댓글 좋아요 API 응답:', data);
      
      if (!response.ok) {
        throw new Error(data.message || '댓글 좋아요 처리 실패');
      }
      
      return data.data || data;
    } catch (error) {
      console.error('댓글 좋아요 에러:', error);
      throw error;
    }
  },

  // 게시글 좋아요 통계 조회
  async getPostLikeStats(postId) {
    try {
      const userId = getCurrentUserId();
      const url = userId 
        ? `${API_BASE_URL}/likes/posts/${postId}?userId=${userId}`
        : `${API_BASE_URL}/likes/posts/${postId}`;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      console.log('게시글 좋아요 통계 API 응답:', data);
      
      if (!response.ok) {
        // 좋아요 통계가 없는 경우는 에러가 아님
        return {
          likeCount: 0,
          dislikeCount: 0,
          userLikeType: null
        };
      }
      
      return data.data || data;
    } catch (error) {
      console.error('게시글 좋아요 통계 에러:', error);
      // 에러 발생 시 기본값 반환
      return {
        likeCount: 0,
        dislikeCount: 0,
        userLikeType: null
      };
    }
  },

  // 댓글 좋아요 통계 조회
  async getCommentLikeStats(commentId) {
    try {
      const userId = getCurrentUserId();
      const url = userId 
        ? `${API_BASE_URL}/likes/comments/${commentId}?userId=${userId}`
        : `${API_BASE_URL}/likes/comments/${commentId}`;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      console.log('댓글 좋아요 통계 API 응답:', data);
      
      if (!response.ok) {
        return {
          likeCount: 0,
          dislikeCount: 0,
          userLikeType: null
        };
      }
      
      return data.data || data;
    } catch (error) {
      console.error('댓글 좋아요 통계 에러:', error);
      return {
        likeCount: 0,
        dislikeCount: 0,
        userLikeType: null
      };
    }
  }
};