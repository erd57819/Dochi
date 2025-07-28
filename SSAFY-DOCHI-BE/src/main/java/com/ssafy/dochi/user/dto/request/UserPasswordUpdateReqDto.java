package com.ssafy.dochi.user.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserPasswordUpdateReqDto {
    private String currentPassword;
    private String newPassword;
}
