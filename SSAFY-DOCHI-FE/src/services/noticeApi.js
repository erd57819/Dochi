import { API_CONFIG } from '../config/api';

const BASE_URL = '/dochi/notice';  // Vite 프록시를 통해 /dochi 요청

export const noticeApi = {
  // 공지사항 목록 조회
  async getNotices(page = 0, size = 10, search = '', category = '', isImportant = null) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });
      
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (isImportant !== null) params.append('isImportant', isImportant.toString());

      const response = await fetch(`${BASE_URL}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
      throw error;
    }
  },

  // 공지사항 상세 조회
  async getNotice(noticeId) {
    try {
      const response = await fetch(`${BASE_URL}/${noticeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('공지사항 상세 조회 실패:', error);
      throw error;
    }
  },

  // 공지사항 작성
  async createNotice(noticeData) {
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noticeData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.status === 201;
    } catch (error) {
      console.error('공지사항 작성 실패:', error);
      throw error;
    }
  },

  // 공지사항 수정
  async updateNotice(noticeId, noticeData) {
    try {
      const response = await fetch(`${BASE_URL}/${noticeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noticeData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.ok;
    } catch (error) {
      console.error('공지사항 수정 실패:', error);
      throw error;
    }
  },

  // 공지사항 삭제
  async deleteNotice(noticeId) {
    try {
      const response = await fetch(`${BASE_URL}/${noticeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.ok;
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
      throw error;
    }
  },
};