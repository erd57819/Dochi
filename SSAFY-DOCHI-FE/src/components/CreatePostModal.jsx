import React, { useState } from 'react';
import { communityApi } from '../services/communityApi';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'GENERAL', label: '자유게시판' },
    { value: 'CONFLICT_SHARING', label: '갈등공유' },
    { value: 'SUCCESS_STORIES', label: '성공사례' },
    { value: 'ADVICE_REQUEST', label: '조언요청' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await communityApi.createPost(formData);
      alert('게시글이 성공적으로 작성되었습니다!');
      setFormData({ title: '', content: '', category: 'GENERAL' });
      onPostCreated();
      onClose();
    } catch (error) {
      alert('게시글 작성에 실패했습니다: ' + error.message);
      console.error('게시글 작성 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">새 게시글 작성</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="게시글 제목을 입력하세요"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="게시글 내용을 입력하세요"
              rows={8}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400"
            >
              {isSubmitting ? '작성 중...' : '게시글 작성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;