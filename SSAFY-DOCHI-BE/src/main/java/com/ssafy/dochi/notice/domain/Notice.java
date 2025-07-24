package com.ssafy.dochi.notice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Notice {

    private Long id;
    private Long userId;                    // user_id (FK)
    private String title;
    private String content;
    private NoticeCategory category;        // ENUM('SYSTEM', 'UPDATE', 'MAINTENANCE', 'ANNOUNCEMENT')
    private Boolean isImportant;            // is_important
    private Boolean isPopup;                // is_popup
    private Integer viewCount;              // view_count
    private LocalDateTime publishDate;      // publish_date
    private LocalDateTime expireDate;       // expire_date
    private LocalDateTime createdAt;        // created_at
    private LocalDateTime updatedAt;        // updated_at

    // 카테고리 ENUM
    public enum NoticeCategory {
        SYSTEM, UPDATE, MAINTENANCE, ANNOUNCEMENT
    }
}