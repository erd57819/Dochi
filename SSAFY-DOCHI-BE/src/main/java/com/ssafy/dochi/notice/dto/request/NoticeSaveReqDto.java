package com.ssafy.dochi.notice.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class NoticeSaveReqDto {
    private String title;
    private String content;
    private String category; // system, update, maintenance, announcement
    private Boolean isImportant = false;
    private Boolean isPopup = false;
    private LocalDateTime publishDate;
    private LocalDateTime expireDate;
}