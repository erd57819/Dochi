package com.ssafy.dochi.community.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class CommunityPageResDto<T> {
    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private int totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;

    public CommunityPageResDto(List<T> content, int pageNumber, int pageSize, int totalElements, int totalPages) {
        this.content = content;
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.first = pageNumber == 0;
        this.last = pageNumber == totalPages - 1;
    }
}