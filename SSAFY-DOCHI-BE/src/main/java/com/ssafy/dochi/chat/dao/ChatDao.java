package com.ssafy.dochi.chat.dao;

import com.ssafy.dochi.chat.domain.ChatMessage;
import com.ssafy.dochi.chat.domain.ChatRoom;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ChatDao {
    Long saveChatRoom(ChatRoom chatRoom);

    void saveChat(ChatMessage chat);

    Long findChatRoomIdByUserId(@Param("memberId") Long memberId);
}
