package com.ssafy.dochi.chat.domain;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chat {
    private Long id;
    private Long chatRoomId;
    private Long userId;
    private String senderType; // USER, BOT
    private String message;
    private LocalDateTime timestamp;
}
