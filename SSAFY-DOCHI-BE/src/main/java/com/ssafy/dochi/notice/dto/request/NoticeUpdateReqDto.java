package com.ssafy.dochi.notice.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class NoticeUpdateReqDto {
    private Long id;
    private String title;
    private String content;
    private String category;
    private Boolean isImportant;
    private Boolean isPopup;
    private LocalDateTime publishDate;
    private LocalDateTime expireDate;
    private Boolean isActive;
}