package com.ssafy.dochi.chat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AiSingleChatResDto {
    UserMessage userMessage;
    AiMessage aiMessage;
}
