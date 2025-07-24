package com.ssafy.dochi.notice.service;

import com.ssafy.dochi.notice.domain.Notice;
import com.ssafy.dochi.notice.domain.Notice.NoticeCategory;
import com.ssafy.dochi.notice.dto.request.NoticeSaveReqDto;
import com.ssafy.dochi.notice.dto.request.NoticeUpdateReqDto;
import com.ssafy.dochi.notice.dto.response.NoticeInfoResDto;
import com.ssafy.dochi.notice.dto.response.NoticePageResDto;
import com.ssafy.dochi.notice.dto.response.NoticeResDto;

import java.util.List;

public interface NoticeService {
    void save(NoticeSaveReqDto dto, Long userId);
    void update(NoticeUpdateReqDto dto);
    void delete(Long id);
    List<Notice> findAll();
    NoticeInfoResDto findById(Long id);
    NoticePageResDto<NoticeResDto> findAll(int page, int size, String search, NoticeCategory category, Boolean isImportant);
}