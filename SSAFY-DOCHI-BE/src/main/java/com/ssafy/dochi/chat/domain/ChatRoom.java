package com.ssafy.dochi.chat.domain;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoom {
    private Long id;
    @Setter
    private Long userId;
    private String title;
    private String sessionId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
