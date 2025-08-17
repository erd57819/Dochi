package com.ssafy.dochi.notice.dao;

import java.util.List;
import java.util.Map;

import com.ssafy.dochi.notice.dto.response.NoticeInfoResDto;
import com.ssafy.dochi.notice.dto.response.NoticeResDto;
import org.apache.ibatis.annotations.Mapper;

import com.ssafy.dochi.notice.domain.Notice;

@Mapper
public interface NoticeDao {
    void insert(Notice notice);
    void update(Notice notice);
    void delete(Long id);
    NoticeInfoResDto findById(Long id);
    List<Notice> findAll();
    void incrementViewCount(Long id);
    List<NoticeResDto> findAllWithPaging(Map<String, Object> params);
    int getTotalCount(Map<String, Object> params);
}