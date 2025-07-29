package com.ssafy.dochi.user.dto.request;

import lombok.Getter;

@Getter
public class UserLoginReqDto {
    private String userId;
    private String password;
}
