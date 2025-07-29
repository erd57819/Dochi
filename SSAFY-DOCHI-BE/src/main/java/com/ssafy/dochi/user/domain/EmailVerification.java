package com.ssafy.dochi.user.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailVerification {
    private Long id;
    private String email;
    private String verificationCode;
    private LocalDateTime expiresAt;
    private boolean isVerified;
    private LocalDateTime createdAt;
}
