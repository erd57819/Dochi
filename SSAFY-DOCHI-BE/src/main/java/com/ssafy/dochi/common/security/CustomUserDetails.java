package com.ssafy.dochi.common.security;

import lombok.AllArgsConstructor;
import lombok.Getter;

// 임시 Mock 클래스 - 유저 모듈 완성되면 교체 예정
@Getter
@AllArgsConstructor
public class CustomUserDetails {
    private Long id;
    private String username;
    private String email;

    // 기본 생성자
    public CustomUserDetails() {
        this.id = 1L;
        this.username = "testuser";
        this.email = "test@example.com";
    }
}