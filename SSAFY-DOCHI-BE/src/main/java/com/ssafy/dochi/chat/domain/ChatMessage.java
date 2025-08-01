package com.ssafy.dochi.chat.domain;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {
    private Long id;

    private Long userId;
    private String senderType;  // USER or BOT
    private String message;
    private LocalDateTime timestamp;
    private Long chatRoomId;
    private LocalDateTime createdAt;
}