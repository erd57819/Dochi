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
}
