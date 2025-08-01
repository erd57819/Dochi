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
    private Long userId;  // memberId → userId로 변경

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
