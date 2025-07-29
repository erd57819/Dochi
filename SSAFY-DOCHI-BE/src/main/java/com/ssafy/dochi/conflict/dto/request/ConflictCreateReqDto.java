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
    private String desiredOutcome;
    private Priority priority;
    private TalkWillingness talkWillingness;
    private InitialEmotion initialEmotion;
    private Integer intensity;
    private String aiSummary;
}