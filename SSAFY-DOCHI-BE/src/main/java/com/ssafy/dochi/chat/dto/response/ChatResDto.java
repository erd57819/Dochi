package com.ssafy.dochi.chat.dto.response;

import com.ssafy.dochi.chat.domain.ChatMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatResDto {
    private Long id;
    private String senderType;
    private String message;
    private String timestamp;

    // 엔티티를 DTO로 변환
    public static ChatResDto fromEntity(ChatMessage chat) {
        return ChatResDto
                .builder()
                .id(chat.getId())
                .senderType(chat.getSenderType())
                .message(chat.getMessage())
                .timestamp(chat.getTimestamp().toString())
                .build();
    }
}
