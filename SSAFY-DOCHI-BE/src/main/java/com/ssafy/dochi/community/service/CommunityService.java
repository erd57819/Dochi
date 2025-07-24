package com.ssafy.dochi.community.service;

import com.ssafy.dochi.notice.domain.Notice;
import com.ssafy.dochi.notice.dto.request.NoticeSaveReqDto;
import com.ssafy.dochi.notice.dto.request.NoticeUpdateReqDto;
import com.ssafy.dochi.notice.dto.response.NoticeInfoResDto;
import com.ssafy.dochi.notice.dto.response.NoticePageResDto;
import com.ssafy.dochi.notice.dto.response.NoticeResDto;

import java.util.List;

public interface CommunityService {
    void save(NoticeSaveReqDto dto, Long userId);
    void update(NoticeUpdateReqDto dto, Long userId);
    void delete(Long id, Long userId);
    List<Notice> findAll();
    NoticeInfoResDto findById(Long id);
    NoticePageResDto<NoticeResDto> findAll(int page, int size, String search, String category);
    List<NoticeResDto> findImportantNotices();
    List<NoticeResDto> findPopupNotices();
}