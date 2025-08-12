package com.ssafy.dochi.conflict.dto.response;

import com.ssafy.dochi.conflict.domain.UserConflict;
import com.ssafy.dochi.conflict.domain.UserConflict.*;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ConflictResDto {
    private Long id;
    private String title;
    private String description;
    private ConflictType conflictType;
    private Integer conflictWhen;
    private Integer conflictFrequency;
    private String participants;
    private String desiredOutcome;
    private Priority priority;
    private TalkWillingness talkWillingness;
    private String initialEmotion;  // String으로 변경
    private Integer intensity;
    private String aiSummary;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ConflictResDto from(UserConflict conflict) {
        return new ConflictResDto(
            conflict.getId(),
            conflict.getTitle(),
            conflict.getDescription(),
            conflict.getConflictType(),
            conflict.getConflictWhen(),
            conflict.getConflictFrequency(),
            conflict.getParticipants(),
            conflict.getDesiredOutcome(),
            conflict.getPriority(),
            conflict.getTalkWillingness(),
            conflict.getInitialEmotion(),
            conflict.getIntensity(),
            conflict.getAiSummary(),
            conflict.getCreatedAt(),
            conflict.getUpdatedAt()
        );
    }
}