package com.ssafy.dochi.community.service;

import com.ssafy.dochi.community.dao.CommunityDao;
import com.ssafy.dochi.community.domain.Community;
import com.ssafy.dochi.community.dto.request.CommunitySaveReqDto;
import com.ssafy.dochi.community.dto.request.CommunityUpdateReqDto;
import com.ssafy.dochi.community.dto.response.CommunityPageResDto;
import com.ssafy.dochi.community.dto.response.CommunityResDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class CommunityServiceImpl implements CommunityService {

    private final CommunityDao communityDao;

    /**
     * 메서드 설명: 새로운 커뮤니티 게시글을 저장합니다.
     * @param communitySaveReqDto 게시글 저장 요청 DTO
     * @param userId 작성자 ID
     */
    @Override
    public void savePost(CommunitySaveReqDto communitySaveReqDto, Long userId) {
        Community community = Community.builder()
                .userId(userId)
                .title(communitySaveReqDto.getTitle())
                .content(communitySaveReqDto.getContent())
                .category(communitySaveReqDto.getCategory())
                .build();
        communityDao.insert(community);
    }

    /**
     * 메서드 설명: 기존 커뮤니티 게시글을 수정합니다.
     * @param communityId 수정할 게시글 ID
     * @param communityUpdateReqDto 게시글 수정 요청 DTO
     * @param userId 사용자 ID (권한 확인용)
     */
    @Override
    public void updatePost(Long communityId, CommunityUpdateReqDto communityUpdateReqDto, Long userId) {
        CommunityResDto foundCommunity = communityDao.findById(communityId);
        // FIXME: 예외 처리를 전역 예외 핸들러에서 처리하도록 개선 필요
        if (foundCommunity == null || !Objects.equals(foundCommunity.getUserId(), userId)) {
            throw new RuntimeException("게시글을 수정할 권한이 없습니다.");
        }

        Community community = Community.builder()
                .id(communityId)
                .title(communityUpdateReqDto.getTitle())
                .content(communityUpdateReqDto.getContent())
                .category(communityUpdateReqDto.getCategory())
                .build();
        communityDao.update(community);
    }

    /**
     * 메서드 설명: 커뮤니티 게시글을 삭제합니다. (Soft Delete)
     * @param communityId 삭제할 게시글 ID
     * @param userId 사용자 ID (권한 확인용)
     */
    @Override
    public void deletePost(Long communityId, Long userId) {
        CommunityResDto foundCommunity = communityDao.findById(communityId);
        if (foundCommunity == null || !Objects.equals(foundCommunity.getUserId(), userId)) {
            throw new RuntimeException("게시글을 삭제할 권한이 없습니다.");
        }
        communityDao.softDelete(communityId);
    }

    /**
     * 메서드 설명: ID로 게시글을 조회하고 조회수를 1 증가시킵니다.
     * @param communityId 조회할 게시글 ID
     * @return 조회된 게시글 정보
     */
    @Override
    @Transactional(readOnly = true)
    public CommunityResDto findPostById(Long communityId) {
        communityDao.incrementViewCount(communityId);
        return communityDao.findById(communityId);
    }

    /**
     * 메서드 설명: 모든 게시글을 페이징하여 조회합니다.
     * @param page 페이지 번호
     * @param size 페이지 당 게시글 수
     * @param search 검색 키워드
     * @param category 카테고리 필터
     * @return 페이징된 게시글 목록
     */
    @Override
    @Transactional(readOnly = true)
    public CommunityPageResDto<CommunityResDto> findAllPosts(int page, int size, String search, String category) {
        Map<String, Object> params = new HashMap<>();
        params.put("search", search);
        params.put("category", category);

        int totalCount = communityDao.getTotalCount(params);

        int offset = page * size;
        params.put("offset", offset);
        params.put("limit", size);

        List<CommunityResDto> content = communityDao.findAllWithPaging(params);

        return new CommunityPageResDto<>(
                content,
                page,
                size,
                totalCount,
                (int) Math.ceil((double) totalCount / size)
        );
    }
}