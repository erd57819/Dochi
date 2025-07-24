package com.ssafy.dochi.community.dao;

import com.ssafy.dochi.community.domain.Community;
import com.ssafy.dochi.community.dto.response.CommunityResDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface CommunityDao {
    void insert(Community community);
    void update(Community community);
    void softDelete(Long id);
    CommunityResDto findById(Long id);
    void incrementViewCount(Long id);
    List<CommunityResDto> findAllWithPaging(Map<String, Object> params);
    int getTotalCount(Map<String, Object> params);
    // TODO: 댓글 기능 구현 시, 댓글 수 업데이트 메서드 추가 필요
    // void updateCommentCount(Long id, int count);
}