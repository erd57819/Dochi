package com.ssafy.dochi.user.dto.request;

import lombok.Getter;

@Getter
public class UserSignUpReqDto {
    private String userId;
    private String name;
    private String nickname;
    private String email;
    private String password;
    private String role;
    private Integer age;
    private String gender;         // MALE / FEMALE /NONE
    private String address;
    private String profileImage;
}
