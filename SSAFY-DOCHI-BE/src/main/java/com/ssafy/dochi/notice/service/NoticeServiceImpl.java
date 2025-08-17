package com.ssafy.dochi.notice.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.ssafy.dochi.notice.domain.Notice.NoticeCategory;
import com.ssafy.dochi.notice.dto.response.NoticeInfoResDto;
import com.ssafy.dochi.notice.dto.response.NoticePageResDto;
import com.ssafy.dochi.notice.dto.response.NoticeResDto;
import org.springframework.stereotype.Service;

import com.ssafy.dochi.notice.domain.Notice;
import com.ssafy.dochi.notice.dto.request.NoticeSaveReqDto;
import com.ssafy.dochi.notice.dto.request.NoticeUpdateReqDto;
import com.ssafy.dochi.notice.dao.NoticeDao;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoticeServiceImpl implements NoticeService {
    private final NoticeDao noticeDao;

    @Override
    public void save(NoticeSaveReqDto dto, Long userId) {
        Notice notice = Notice.builder()
                .userId(userId)
                .title(dto.getTitle())
                .content(dto.getContent())
                .category(dto.getCategory() != null ? dto.getCategory() : NoticeCategory.ANNOUNCEMENT)
                .isImportant(dto.getIsImportant() != null ? dto.getIsImportant() : false)
                .isPopup(dto.getIsPopup() != null ? dto.getIsPopup() : false)
                .viewCount(0)
                .publishDate(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        noticeDao.insert(notice);
    }

    @Override
    public void update(NoticeUpdateReqDto dto) {
        Notice notice = Notice.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .content(dto.getContent())
                .category(dto.getCategory())
                .isImportant(dto.getIsImportant())
                .isPopup(dto.getIsPopup())
                .updatedAt(LocalDateTime.now())
                .build();
        noticeDao.update(notice);
    }

    @Override
    public void delete(Long id) {
        noticeDao.delete(id);
    }

    @Override
    public List<Notice> findAll() {
        return noticeDao.findAll();
    }

    @Override
    public NoticeInfoResDto findById(Long id) {
        noticeDao.incrementViewCount(id);
        return noticeDao.findById(id);
    }

    @Override
    public NoticePageResDto<NoticeResDto> findAll(int page, int size, String search, NoticeCategory category, Boolean isImportant) {
        Map<String, Object> params = new HashMap<>();

        // 검색어가 있으면 파라미터에 추가
        if (search != null && !search.trim().isEmpty()) {
            params.put("search", search);
        }

        // 카테고리 필터
        if (category != null) {
            params.put("category", category.name());
        }

        // 중요 공지 필터
        if (isImportant != null) {
            params.put("isImportant", isImportant);
        }

        // 전체 개수 조회
        int totalCount = noticeDao.getTotalCount(params);

        // 페이징 처리를 위한 파라미터 설정
        int offset = page * size;
        params.put("offset", offset);
        params.put("limit", size);

        // 데이터 조회
        List<NoticeResDto> content = noticeDao.findAllWithPaging(params);

        // 페이징 응답 생성
        return new NoticePageResDto<>(
                content,
                page,
                size,
                totalCount,
                (int) Math.ceil((double) totalCount / size)
        );
    }
}