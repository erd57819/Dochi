package com.ssafy.dochi.community.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommunityContentGenerateResDto {
    private String title;
    private String content;
}