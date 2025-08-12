package com.ssafy.dochi.community.service;

import com.ssafy.dochi.community.dao.CommunityDao;
import com.ssafy.dochi.community.domain.Community;
import com.ssafy.dochi.community.dto.request.CommunitySaveReqDto;
import com.ssafy.dochi.community.dto.request.CommunityContentGenerateReqDto;
import com.ssafy.dochi.community.dto.request.CommunityUpdateReqDto;
import com.ssafy.dochi.community.dto.response.CommunityContentGenerateResDto;
import com.ssafy.dochi.community.dto.response.CommunityPageResDto;
import com.ssafy.dochi.community.dto.response.CommunityResDto;
import com.ssafy.dochi.config.GmsAiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CommunityServiceImpl implements CommunityService {

    private final CommunityDao communityDao;
    private final GmsAiClient gmsAiClient;

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
    public CommunityResDto findPostById(Long communityId) {
        // 먼저 게시글 조회 (읽기 전용)
        CommunityResDto post = findPostByIdReadOnly(communityId);

        if (post == null) {
            throw new RuntimeException("게시글을 찾을 수 없습니다.");
        }

        // 조회수 증가를 별도 트랜잭션으로 비동기 처리
        try {
            incrementViewCountSeparately(communityId);
        } catch (Exception e) {
            // 조회수 증가 실패해도 게시글 조회는 성공으로 처리
            log.warn("조회수 증가 실패 - 게시글 ID: {}, 오류: {}", communityId, e.getMessage());
        }

        return post;
    }

    /**
     * 게시글 조회만 수행 (읽기 전용)
     */
    @Transactional(readOnly = true)
    private CommunityResDto findPostByIdReadOnly(Long communityId) {
        return communityDao.findById(communityId);
    }

    /**
     * 조회수 증가를 별도 트랜잭션으로 처리
     * REQUIRES_NEW를 사용하여 새로운 트랜잭션에서 실행
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private void incrementViewCountSeparately(Long communityId) {
        try {
            communityDao.incrementViewCount(communityId);
        } catch (Exception e) {
            log.error("조회수 증가 실패 - 게시글 ID: {}", communityId, e);
            throw e;
        }
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

    /**
     * 메서드 설명: 카테고리별 AI 컨텐츠를 생성합니다.
     * @param request 컨텐츠 생성 요청 DTO
     * @return 생성된 제목과 내용
     */
    @Override
    public CommunityContentGenerateResDto generateContent(CommunityContentGenerateReqDto request) {
        try {
            log.info("AI 컨텐츠 생성 요청 - 카테고리: {}, titlePrompt: {}, contentPrompt: {}", 
                    request.getCategory(), request.getTitlePrompt(), request.getContentPrompt());
            
            // 갈등 컨텍스트가 null이거나 비어있으면 기본 가이드 템플릿 반환
            if (isEmptyPrompt(request.getTitlePrompt()) && isEmptyPrompt(request.getContentPrompt())) {
                log.info("갈등 컨텍스트가 비어있음 - 카테고리별 기본 가이드 반환: {}", request.getCategory());
                return getDefaultTemplate(request.getCategory());
            }
            
            // AI에게 제목 생성 요청
            String titlePrompt = buildTitlePrompt(request.getCategory(), request.getTitlePrompt());
            String generatedTitle = gmsAiClient.ask(titlePrompt, "gpt-4o-mini");
            
            // AI에게 내용 생성 요청  
            String contentPrompt = buildContentPrompt(request.getCategory(), request.getContentPrompt());
            String generatedContent = gmsAiClient.ask(contentPrompt, "gpt-4o-mini");
            
            log.info("AI 컨텐츠 생성 완료 - 카테고리: {}", request.getCategory());
            
            return new CommunityContentGenerateResDto(
                cleanGeneratedText(generatedTitle),
                cleanGeneratedText(generatedContent)
            );
            
        } catch (Exception e) {
            log.error("AI 컨텐츠 생성 실패 - 카테고리: {}", request.getCategory(), e);
            // 실패 시 기본 템플릿 반환
            return getDefaultTemplate(request.getCategory());
        }
    }
    
    /**
     * 프롬프트가 비어있거나 가이드 텍스트인지 확인하는 헬퍼 메서드
     */
    private boolean isEmptyPrompt(String prompt) {
        if (prompt == null || prompt.trim().isEmpty() || prompt.trim().equals("null")) {
            return true;
        }
        
        // 프론트엔드의 기본 가이드 텍스트인지 확인
        String trimmed = prompt.trim();
        return trimmed.contains("게시글에 적합한 제목을") || 
               trimmed.contains("게시글 내용을 작성해주세요") ||
               trimmed.contains("예:") ||
               trimmed.contains("찬반대결 게시글 형태로 내용을 작성해주세요") ||
               trimmed.contains("찬성 입장과 반대 입장을 명확히 제시하고") ||
               trimmed.length() < 5; // 너무 짧은 프롬프트는 가이드로 간주
    }
    
    /**
     * 제목 생성을 위한 프롬프트 구성
     */
    private String buildTitlePrompt(String category, String userPrompt) {
        String basePrompt = "당신은 커뮤니티 게시글 제목을 생성하는 전문가입니다. ";
        String categoryContext = getCategoryContext(category);
        String guidelines = "다음 가이드라인을 따라 한국어로 매력적이고 적절한 제목을 생성해주세요:\n" +
                "1. 20-50자 이내로 작성\n" +
                "2. 감정적으로 공감할 수 있는 표현 사용\n" +
                "3. 카테고리 특성에 맞는 톤앤매너 적용\n" +
                "4. 대괄호 [] 태그는 필수로 포함\n\n" +
                "요청: " + userPrompt;
        
        return basePrompt + categoryContext + guidelines;
    }
    
    /**
     * 내용 생성을 위한 프롬프트 구성
     */
    private String buildContentPrompt(String category, String userPrompt) {
        String basePrompt = "당신은 커뮤니티 게시글 내용을 생성하는 전문가입니다. ";
        String categoryContext = getCategoryContext(category);
        String guidelines = "다음 가이드라인을 따라 한국어로 engaging하고 유용한 내용을 생성해주세요:\n" +
                "1. 300-800자 정도의 적절한 분량\n" +
                "2. 마크다운 문법 사용하지 말고 일반 텍스트와 이모지, 줄바꿈만 사용\n" +
                "3. 구조화된 내용으로 가독성 향상\n" +
                "4. 카테고리 특성에 맞는 톤앤매너와 구성\n" +
                "5. 커뮤니티 참여를 유도하는 마무리\n\n" +
                "요청: " + userPrompt;
        
        return basePrompt + categoryContext + guidelines;
    }
    
    /**
     * 카테고리별 컨텍스트 정보 제공
     */
    private String getCategoryContext(String category) {
        switch (category) {
            case "CONFLICT_SHARING":
                return "찬반대결 카테고리에서는 갈등 상황을 객관적으로 제시하고 커뮤니티의 다양한 의견을 구하는 게시글을 작성합니다. ";
            case "ADVICE_REQUEST":
                return "조언해줘 카테고리에서는 구체적인 갈등 상황을 설명하고 해결 방안에 대한 조언을 구하는 게시글을 작성합니다. ";
            case "SUCCESS_STORIES":
                return "해결했어요 카테고리에서는 갈등 해결 경험을 단계별로 공유하고 다른 사람들에게 도움이 될 팁을 제공하는 게시글을 작성합니다. ";
            case "GENERAL":
                return "자유게시판에서는 일상적인 갈등 경험이나 고민을 자유롭게 공유하는 게시글을 작성합니다. ";
            default:
                return "일반적인 커뮤니티 게시글을 작성합니다. ";
        }
    }
    
    /**
     * 생성된 텍스트 정리 (불필요한 따옴표, 개행 등 제거)
     */
    private String cleanGeneratedText(String text) {
        if (text == null) return "";
        
        return text.trim()
                .replaceAll("^[\"']", "")  // 시작 따옴표 제거
                .replaceAll("[\"']$", "")  // 끝 따옴표 제거
                .replaceAll("\\n\\s*\\n", "\n\n")  // 연속된 빈 줄 정리
                .trim();
    }
    
    /**
     * AI 생성 실패 시 사용할 기본 템플릿
     */
    private CommunityContentGenerateResDto getDefaultTemplate(String category) {
        switch (category) {
            case "CONFLICT_SHARING":
                return new CommunityContentGenerateResDto(
                    "[찬반대결] 이런 상황에서 어떤 선택이 나을까요?",
                    "안녕하세요! 갈등 상황에 대해 여러분의 다양한 의견을 듣고 싶어 글을 올립니다.\n\n" +
                    "🤔 **상황 설명**\n" +
                    "• 갈등이 발생한 배경과 상황을 구체적으로 설명해주세요\n" +
                    "• 어떤 사람들이 관련되어 있는지 알려주세요\n" +
                    "• 언제, 어디서 일어난 일인지 맥락을 제시해주세요\n\n" +
                    "⚖️ **찬반 의견 구하기**\n" +
                    "**👍 찬성 입장:**\n" +
                    "• 이 방법이 좋다고 생각하는 이유\n" +
                    "• 기대할 수 있는 긍정적인 결과\n" +
                    "• 장기적으로 도움이 될 점\n\n" +
                    "**👎 반대 입장:**\n" +
                    "• 이 방법이 우려되는 이유\n" +
                    "• 예상되는 부작용이나 위험\n" +
                    "• 다른 대안이 더 나은 이유\n\n" +
                    "💭 **여러분이라면 어떤 선택을 하실 건가요?**\n" +
                    "다른 좋은 방법이 있다면 그것도 함께 제안해주세요!\n\n" +
                    "정말 고민이 많이 되는 상황이라 여러분의 솔직한 조언이 큰 도움이 될 것 같습니다. 🙏\n\n" +
                    "#찬반대결 #갈등해결 #의견구함"
                );
            case "ADVICE_REQUEST":
                return new CommunityContentGenerateResDto(
                    "[조언해줘] 갈등 해결을 위한 조언이 필요해요",
                    "갈등 상황에서 현명한 해결 방안을 찾기 위해 여러분의 조언을 구합니다.\n\n" +
                    "😰 현재 상황:\n갈등의 배경과 현재 상태를 시간순으로 정리해서 설명해주세요. 언제부터 시작되었는지, 주요 쟁점이 무엇인지 명확하게 적어주시면 더 정확한 조언을 받을 수 있어요.\n\n" +
                    "🤝 원하는 결과:\n이 갈등을 통해 궁극적으로 어떤 결과를 원하시나요? 관계 회복, 문제 해결, 상호 이해 등 구체적인 목표를 제시해주세요.\n\n" +
                    "💭 고민하는 점:\n어떤 부분에서 가장 고민이 되시나요? 어떤 접근 방식을 택해야 할지, 타이밍은 언제가 좋을지 등 구체적인 고민거리를 공유해주세요.\n\n" +
                    "🔄 이미 시도한 방법:\n지금까지 어떤 노력을 해보셨나요? 시도해본 방법들과 그 결과도 함께 공유해주시면 더 나은 대안을 제시받을 수 있어요.\n\n" +
                    "비슷한 경험이 있으시거나 좋은 조언이 있으시면 댓글로 도움 부탁드립니다! 🙏\n\n" +
                    "#조언구함 #갈등해결 #도움요청"
                );
            case "SUCCESS_STORIES":
                return new CommunityContentGenerateResDto(
                    "[해결했어요] 이런 방법으로 갈등을 해결했습니다",
                    "안녕하세요! 갈등을 성공적으로 해결한 경험을 공유합니다.\n\n" +
                    "😅 처음 상황:\n[갈등이 시작된 상황을 설명해주세요]\n\n" +
                    "🎯 해결 과정:\n\n" +
                    "1단계: [첫 번째 단계]\n- [구체적인 행동이나 방법]\n- [그 결과나 변화]\n\n" +
                    "2단계: [두 번째 단계]\n- [구체적인 행동이나 방법]\n- [그 결과나 변화]\n\n" +
                    "3단계: [세 번째 단계]\n- [구체적인 행동이나 방법]\n- [그 결과나 변화]\n\n" +
                    "✨ 해결 결과:\n[최종적으로 어떻게 해결되었는지 설명해주세요]\n\n" +
                    "💡 다른 분들께 드리는 팁:\n- [도움이 될 수 있는 조언이나 팁]\n- [주의할 점이나 실수했던 부분]\n\n" +
                    "같은 고민을 하시는 분들에게 도움이 되길 바랍니다! 💪\n\n" +
                    "#해결성공 #갈등해결 #경험공유"
                );
            default:
                return new CommunityContentGenerateResDto(
                    "일상 속 갈등과 소통 이야기",
                    "일상에서 마주하는 크고 작은 갈등들과 소통에 관한 이야기를 자유롭게 나누는 공간입니다.\n\n" +
                    "💭 나누고 싶은 이야기:\n가족, 친구, 직장, 학교 등에서 겪은 갈등이나 소통의 어려움을 자유롭게 공유해주세요. 작은 에피소드부터 깊은 고민까지 모든 이야기를 환영합니다.\n\n" +
                    "🤝 함께 이야기하고 싶은 주제:\n갈등 해결, 소통 방법, 인간관계, 감정 관리 등 커뮤니티와 함께 이야기하고 싶은 주제가 있다면 자유롭게 제시해주세요.\n\n" +
                    "🌟 이런 이야기들을 나눠주세요:\n- 갈등을 통해 배운 점이나 성장한 경험\n- 효과적이었던 소통 방법이나 해결 전략\n- 아직 해결하지 못한 고민이나 궁금한 점\n- 갈등 상황에서 느꼈던 감정이나 생각들\n\n" +
                    "여러분의 솔직한 경험과 생각이 다른 분들에게도 큰 도움과 위로가 될 거예요! 😊\n\n" +
                    "#자유게시판 #일상공유 #소통 #갈등이야기"
                );
        }
    }
}