package com.ssafy.dochi.chat.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatReqDto {
    private String sessionId;
    private String message;
    private String mode; // NORMAL, COMFORT_ONLY, TIMELINE, COMIC
}

