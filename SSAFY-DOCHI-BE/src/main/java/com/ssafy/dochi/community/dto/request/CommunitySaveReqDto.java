package com.ssafy.dochi.community.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CommunitySaveReqDto {
    private String title;
    private String content;
    private String category;
    // TODO: 태그 기능 추가 시 tags 필드 활성화 필요
    // private List<String> tags;
}