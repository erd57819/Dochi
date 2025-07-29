package com.ssafy.dochi.conflict.dto.request;

import lombok.Getter;

@Getter
public class FinalizeConflictReqDto {
    private String aiSummary;     // AI 요약
    private String aiSolutions;   // AI 해결방안
}