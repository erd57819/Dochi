package com.ssafy.dochi.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class UserInfoResDto {
    private String userId;
    private String name;
    private String nickname;
    private String profileImage;
    private String email;
    private String address;
    private int age;
    private String gender;
    private LocalDateTime created_at;
}
