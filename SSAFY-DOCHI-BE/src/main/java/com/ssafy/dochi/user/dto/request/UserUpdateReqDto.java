package com.ssafy.dochi.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class UserUpdateReqDto {
    @NotBlank
    private String nickname;

    private String address;


}
