package com.ssafy.dochi.conflict.dto.request;

import com.ssafy.dochi.conflict.domain.UserConflict.ConflictType;
import lombok.Getter;

@Getter
public class ConflictSummaryReqDto {
    private String description;
    private ConflictType conflictType;
}