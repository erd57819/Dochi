package com.ssafy.dochi.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProfileImageResDto {
    private String presignedUrl;
    private String imageKey;
    private String message;
}
