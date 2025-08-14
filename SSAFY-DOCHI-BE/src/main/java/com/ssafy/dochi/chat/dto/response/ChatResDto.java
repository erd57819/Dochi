package com.ssafy.dochi.chat.dto.response;

import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatResDto {
    private String senderType; // USER, BOT
    private String message;
    private String timestamp;
    private String description; // 만화 설명 (COMIC 모드에서만 사용)
}
