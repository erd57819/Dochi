package com.ssafy.dochi.user.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProfileImageReqDto {
    private String fileName;
    private String contentType;
}
