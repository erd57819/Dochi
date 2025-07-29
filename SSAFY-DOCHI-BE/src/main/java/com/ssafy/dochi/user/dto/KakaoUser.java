package com.ssafy.dochi.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class KakaoUser {
    private final Long id;
    private final String email;
    private final String name;
    private final String profileImageUrl;
}
