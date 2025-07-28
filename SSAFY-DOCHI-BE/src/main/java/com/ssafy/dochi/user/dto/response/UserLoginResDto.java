package com.ssafy.dochi.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserLoginResDto {
    private String accessToken;
    private String refreshToken;
    private String profileImage;
    private String name;
    private String nickname;
    private String userId;
    private String email;
    private String role;
    private boolean isSocial;
}
