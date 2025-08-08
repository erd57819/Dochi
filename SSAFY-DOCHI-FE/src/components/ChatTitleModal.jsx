import React, { useState } from 'react';

const ChatTitleModal = ({ isOpen, onClose, onConfirm }) => {
  const [title, setTitle] = useState('');

  const handleConfirm = () => {
    if (title.trim()) {
      onConfirm(title.trim());
      setTitle('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">새로운 상담 시작</h3>
          <p className="text-gray-600 text-sm">어떤 갈등에 대해 이야기하고 싶나요?</p>
        </div>
        
        <div className="mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="예: 직장 상사와의 갈등, 친구와의 오해..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            autoFocus
            maxLength={50}
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {title.length}/50
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!title.trim()}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            상담 시작
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTitleModal;
