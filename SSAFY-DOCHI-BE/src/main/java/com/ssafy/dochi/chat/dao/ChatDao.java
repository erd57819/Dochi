package com.ssafy.dochi.chat.dao;

import com.ssafy.dochi.chat.domain.Chat;
import com.ssafy.dochi.chat.domain.ChatRoom;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ChatDao {
    // 새로운 채팅방 생성
    void saveChatRoom(ChatRoom chatRoom);
    // 특정 사용자의 모든 채팅방 조회
    List<ChatRoom> findAllRoomsByUserId(@Param("userId") Long userId);
    // 채팅방 ID로 채팅 메시지 전체 조회
    List<Chat> findAllByChatRoomId(@Param("chatRoomId") Long chatRoomId);
    // 채팅 메시지 저장
    void saveChat(Chat chat);
    // 특정 채팅방 삭제 (채팅 메시지는 별도 먼저 삭제 필요)
    void deleteRoomById(@Param("chatRoomId") Long chatRoomId);
    // 특정 채팅방의 메시지 전체 삭제
    void deleteMessagesByRoomId(@Param("chatRoomId") Long chatRoomId);
}
