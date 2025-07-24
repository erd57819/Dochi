package com.ssafy.dochi.community.service;

import com.ssafy.dochi.community.dto.request.CommunitySaveReqDto;
import com.ssafy.dochi.community.dto.request.CommunityUpdateReqDto;
import com.ssafy.dochi.community.dto.response.CommunityPageResDto;
import com.ssafy.dochi.community.dto.response.CommunityResDto;

public interface CommunityService {
    void savePost(CommunitySaveReqDto communitySaveReqDto, Long userId);
    void updatePost(Long communityId, CommunityUpdateReqDto communityUpdateReqDto, Long userId);
    void deletePost(Long communityId, Long userId);
    CommunityResDto findPostById(Long communityId);
    CommunityPageResDto<CommunityResDto> findAllPosts(int page, int size, String search, String category);
}