package com.ssafy.dochi.conflict.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PACKAGE)
public class UserConflict {
    
    private Long id;
    private Long userId;
    private String title;
    private String description;
    private ConflictType conflictType;
    private Integer conflictWhen;
    private Integer conflictFrequency;
    private String participants; // JSON 형태로 저장
    private String desiredOutcome;  // 복수 선택 가능 (콤마로 구분)
    private Priority priority;
    private TalkWillingness talkWillingness;
    private String initialEmotion;  // 복수 선택 가능 (콤마로 구분) - String으로 변경
    private Integer intensity;
    private String aiSummary; // AI 요약 결과
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 생성자
    public UserConflict(Long userId, String title, String description, ConflictType conflictType,
                       Integer conflictWhen, Integer conflictFrequency, String participants,
                       String desiredOutcome, Priority priority, TalkWillingness talkWillingness,
                       String initialEmotion, Integer intensity, String aiSummary) {
        this.userId = userId;
        this.title = title;
        this.description = description;
        this.conflictType = conflictType;
        this.conflictWhen = conflictWhen;
        this.conflictFrequency = conflictFrequency;
        this.participants = participants;
        this.desiredOutcome = desiredOutcome;
        this.priority = priority;
        this.talkWillingness = talkWillingness;
        this.initialEmotion = initialEmotion;
        this.intensity = intensity;
        this.aiSummary = aiSummary;
    }

    // Enum 정의
    public enum ConflictType {
        WORK, FAMILY, FRIEND, COUPLE, NEIGHBOR, FINANCIAL, ONLINE, ETC
    }

    public enum Priority {
        RELATIONSHIP, SOLUTION, SELF_CARE, PREVENTION, NONE
    }

    public enum TalkWillingness {
        YES, MAYBE, NO, NONE
    }

    public enum InitialEmotion {
        ANGER, SADNESS, FRUSTRATION, ETC
    }
}