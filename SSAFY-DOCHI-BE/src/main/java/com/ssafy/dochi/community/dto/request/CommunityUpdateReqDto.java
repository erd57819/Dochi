package com.ssafy.dochi.community.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CommunityUpdateReqDto {
    private String title;
    private String content;
    private String category;
}