package com.ssafy.dochi.community.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommunityContentGenerateReqDto {
    private String category;
    private String titlePrompt;
    private String contentPrompt;
}