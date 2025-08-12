package com.ssafy.dochi.community.controller;

import com.ssafy.dochi.common.security.CustomUserDetails;
import com.ssafy.dochi.common.template.ApiResponse;
import com.ssafy.dochi.common.template.ApiResponseGenerator;
import com.ssafy.dochi.community.dto.request.CommunitySaveReqDto;
import com.ssafy.dochi.community.dto.request.CommunityContentGenerateReqDto;
import com.ssafy.dochi.community.dto.request.CommunityUpdateReqDto;
import com.ssafy.dochi.community.dto.response.CommunityContentGenerateResDto;
import com.ssafy.dochi.community.dto.response.CommunityPageResDto;
import com.ssafy.dochi.community.dto.response.CommunityResDto;
import com.ssafy.dochi.community.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    /**
     * 메서드 설명: 커뮤니티 게시글 목록을 조회합니다. (페이징, 검색, 필터링)
     * @param page 페이지 번호 (기본값: 0)
     * @param size 페이지 크기 (기본값: 10)
     * @param search 검색 키워드
     * @param category 카테고리
     * @return 페이징된 커뮤니티 게시글 목록
     */
    @GetMapping
    public ApiResponse<ApiResponse.SuccessCustomBody<CommunityPageResDto<CommunityResDto>>> getCommunities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {

        CommunityPageResDto<CommunityResDto> communities = communityService.findAllPosts(page, size, search, category);
        return ApiResponseGenerator.success(communities, HttpStatus.OK);
    }

    /**
     * 메서드 설명: 새로운 커뮤니티 게시글을 작성합니다.
     * @param communitySaveReqDto 게시글 생성 정보
     * @param userDetails 인증된 사용자 정보
     * @return 생성 성공 응답
     */
    @PostMapping
    public ApiResponse<ApiResponse.SuccessCustomBody<Void>> createCommunity(
            @RequestBody CommunitySaveReqDto communitySaveReqDto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        // 인증된 사용자 ID 가져오기 (인증 실패 시 기본값 사용)
        Long userId = (userDetails != null) ? userDetails.getId() : 2L;
        
        try {
            communityService.savePost(communitySaveReqDto, userId);
            return ApiResponseGenerator.success(HttpStatus.CREATED);
        } catch (Exception e) {
            // 로그 추가
            System.err.println("게시글 작성 실패: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * 메서드 설명: 특정 커뮤니티 게시글을 상세 조회합니다.
     * @param communityId 조회할 게시글 ID
     * @return 게시글 상세 정보
     */
    @GetMapping("/{communityId}")
    public ApiResponse<ApiResponse.SuccessCustomBody<CommunityResDto>> getCommunityDetail(
            @PathVariable("communityId") Long communityId) {
        CommunityResDto community = communityService.findPostById(communityId);
        return ApiResponseGenerator.success(community, HttpStatus.OK);
    }

    /**
     * 메서드 설명: 커뮤니티 게시글을 수정합니다.
     * @param communityId 수정할 게시글 ID
     * @param communityUpdateReqDto 수정할 게시글 정보
     * @param userDetails 인증된 사용자 정보
     * @return 수정 성공 응답
     */
    @PutMapping("/{communityId}")
    public ApiResponse<ApiResponse.SuccessCustomBody<Void>> updateCommunity(
            @PathVariable("communityId") Long communityId,
            @RequestBody CommunityUpdateReqDto communityUpdateReqDto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        // 인증된 사용자 ID 가져오기 (인증 실패 시 기본값 사용)
        Long userId = (userDetails != null) ? userDetails.getId() : 2L;
        communityService.updatePost(communityId, communityUpdateReqDto, userId);
        return ApiResponseGenerator.success(HttpStatus.OK);
    }

    /**
     * 메서드 설명: 커뮤니티 게시글을 삭제합니다.
     * @param communityId 삭제할 게시글 ID
     * @param userDetails 인증된 사용자 정보
     * @return 삭제 성공 응답
     */
    @DeleteMapping("/{communityId}")
    public ApiResponse<ApiResponse.SuccessCustomBody<Void>> deleteCommunity(
            @PathVariable("communityId") Long communityId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        // 인증된 사용자 ID 가져오기 (인증 실패 시 기본값 사용)
        Long userId = (userDetails != null) ? userDetails.getId() : 2L;
        communityService.deletePost(communityId, userId);
        return ApiResponseGenerator.success(HttpStatus.OK);
    }

    /**
     * 메서드 설명: 카테고리별 AI 컨텐츠를 생성합니다.
     * @param request 컨텐츠 생성 요청 DTO
     * @return 생성된 제목과 내용
     */
    @PostMapping("/generate-content")
    public ApiResponse<ApiResponse.SuccessCustomBody<CommunityContentGenerateResDto>> generateContent(
            @RequestBody CommunityContentGenerateReqDto request) {
        
        try {
            CommunityContentGenerateResDto result = communityService.generateContent(request);
            return ApiResponseGenerator.success(result, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("AI 컨텐츠 생성 실패: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}