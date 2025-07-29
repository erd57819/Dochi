package com.ssafy.dochi.user.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class EmailVerifyReqDto {
    private String email;
    private String code;
}
