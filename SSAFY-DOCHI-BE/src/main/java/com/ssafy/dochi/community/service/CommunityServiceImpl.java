package com.ssafy.dochi.community.service;

import com.ssafy.dochi.notice.dao.NoticeDao;
import com.ssafy.dochi.notice.domain.Notice;
import com.ssafy.dochi.notice.dto.request.NoticeSaveReqDto;
import com.ssafy.dochi.notice.dto.request.NoticeUpdateReqDto;
import com.ssafy.dochi.notice.dto.response.NoticeInfoResDto;
import com.ssafy.dochi.notice.dto.response.NoticePageResDto;
import com.ssafy.dochi.notice.dto.response.NoticeResDto;
import com.ssafy.dochi.notice.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class CommunityServiceImpl implements NoticeService {

    private final NoticeDao noticeDao;

    @Override
    public void save(NoticeSaveReqDto dto, Long userId) {
        Notice notice = Notice.builder()
                .userId(userId)
                .title(dto.getTitle())
                .content(dto.getContent())
                .category(dto.getCategory() != null ? dto.getCategory() : "announcement")
                .isImportant(dto.getIsImportant() != null ? dto.getIsImportant() : false)
                .isPopup(dto.getIsPopup() != null ? dto.getIsPopup() : false)
                .viewCount(0)
                .publishDate(dto.getPublishDate() != null ? dto.getPublishDate() : LocalDateTime.now())
                .expireDate(dto.getExpireDate())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        noticeDao.insert(notice);
    }

    @Override
    public void update(NoticeUpdateReqDto dto, Long userId) {
        Notice notice = Notice.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .content(dto.getContent())
                .category(dto.getCategory())
                .isImportant(dto.getIsImportant())
                .isPopup(dto.getIsPopup())
                .publishDate(dto.getPublishDate())
                .expireDate(dto.getExpireDate())
                .isActive(dto.getIsActive())
                .updatedAt(LocalDateTime.now())
                .build();

        noticeDao.update(notice);
    }

    @Override
    public void delete(Long id, Long userId) {
        // 실제 삭제가 아닌 비활성화 처리
        Notice notice = Notice.builder()
                .id(id)
                .isActive(false)
                .updatedAt(LocalDateTime.now())
                .build();

        noticeDao.update(notice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notice> findAll() {
        return noticeDao.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public NoticeInfoResDto findById(Long id) {
        // 조회수 증가
        noticeDao.incrementViewCount(id);
        return noticeDao.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public NoticePageResDto<NoticeResDto> findAll(int page, int size, String search, String category) {
        Map<String, Object> params = new HashMap<>();

        // 검색어가 있으면 파라미터에 추가
        if (search != null && !search.trim().isEmpty()) {
            params.put("search", search);
        }

        // 카테고리 필터
        if (category != null && !category.trim().isEmpty()) {
            params.put("category", category);
        }

        // 활성화된 공지만 조회
        params.put("isActive", true);

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

    @Override
    @Transactional(readOnly = true)
    public List<NoticeResDto> findImportantNotices() {
        return noticeDao.findImportantNotices();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoticeResDto> findPopupNotices() {
        return noticeDao.findPopupNotices();
    }
}