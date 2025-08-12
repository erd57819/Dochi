package com.ssafy.dochi.conflict.dto.request;

import com.ssafy.dochi.conflict.domain.UserConflict.*;
import lombok.Getter;

@Getter
public class ConflictCreateReqDto {
    private String title;
    private String description;
    private ConflictType conflictType;
    private Integer conflictWhen;
    private Integer conflictFrequency;
    private String participants;
    private String desiredOutcome;  // 복수 선택 가능 (콤마로 구분)
    private Priority priority;
    private TalkWillingness talkWillingness;
    private String initialEmotion;  // 복수 선택 가능 (콤마로 구분) - String으로 변경
    private Integer intensity;
    private String aiSummary;
}