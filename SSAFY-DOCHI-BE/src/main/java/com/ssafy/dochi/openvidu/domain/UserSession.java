package com.ssafy.dochi.openvidu.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSession {
    private Long id;
    private String sessionId;
    private Long userId;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
