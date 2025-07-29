package com.ssafy.dochi.conflict.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiAnalysisResDto {
    private String summary;    // AI 요약
    private String solutions;  // AI 해결방안
}