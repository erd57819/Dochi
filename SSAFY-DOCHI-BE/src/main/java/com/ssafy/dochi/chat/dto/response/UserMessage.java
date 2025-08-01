package com.ssafy.dochi.chat.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class UserMessage {
    private Long id;
    private String senderType;
    private String message;
    private LocalDate timestamp;


    @Builder
    public UserMessage(Long id, String senderType, String message, LocalDate timestamp) {
        this.id = id;
        this.senderType = senderType;
        this.message = message;
        this.timestamp = timestamp;
    }
}
