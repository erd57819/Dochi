import React from 'react';
import ConflictCard from './ConflictCard';

/**
 * ChatRoomCard – ComfortPage 전용 래퍼
 *   - type: 'normal' | 'empty'
 *   - title, date, onOpen, onCreate props
 *   - 내부적으로 ConflictCard UI 재사용하여 코드 중복 최소화
 */
const ChatRoomCard = ({
  type = 'normal',
  title = '대화 제목',
  date = new Date(),
  onOpen = () => {},
  onCreate = () => {},
}) => {
  if (type === 'empty') {
    return (
      <ConflictCard
        type="empty"
        buttonText="새 대화 만들기"
        onButtonClick={onCreate}
      />
    );
  }

  return (
    <ConflictCard
      type="normal"
      title={title}
      date={date instanceof Date ? date.toLocaleDateString('ko-KR') : new Date(date).toLocaleDateString('ko-KR')}
      buttonText="대화 열기"
      onButtonClick={onOpen}
    />
  );
};

export default ChatRoomCard;