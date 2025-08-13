package com.ssafy.dochi.chat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.dochi.chat.dao.ChatDao;
import com.ssafy.dochi.chat.domain.Chat;
import com.ssafy.dochi.chat.domain.ChatRoom;
import com.ssafy.dochi.chat.dto.request.ChatReqDto;
import com.ssafy.dochi.chat.dto.response.ChatResDto;
import com.ssafy.dochi.config.GmsAiClient;
import com.ssafy.dochi.config.GmsImageClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final ChatDao chatDao;
    private final GmsAiClient gmsAiClient;
    private final GmsImageClient gmsImageClient;

    private static final Duration SESSION_TTL = Duration.ofHours(2);
    private static final String REDIS_PREFIX = "chat:";

    public Long createChatRoom(Long userId, String title) {
        ChatRoom room = ChatRoom.builder()
                .userId(userId)
                .title(title)
                .createdAt(LocalDateTime.now())
                .build();
        chatDao.saveChatRoom(room);
        return room.getId();
    }

    public ChatResDto chat(Long userId, ChatReqDto dto) {
        String sessionId = dto.getSessionId();
        List<String> history = getHistory(sessionId);
        String prompt = buildPrompt(dto.getMode(), history, dto.getMessage());
        String aiResponse;
        if ("COMIC".equals(dto.getMode())) {
            aiResponse = gmsImageClient.generateImage(prompt);
        } else {
            aiResponse = gmsAiClient.ask(prompt, "gpt-4o");
        }
        saveMessage(sessionId, "USER", dto.getMessage());
        saveMessage(sessionId, "BOT", aiResponse);
        return ChatResDto.builder()
                .senderType("BOT")
                .message(aiResponse)
                .timestamp(LocalDateTime.now().toString())
                .build();
    }

    public void saveToDatabase(Long userId, String sessionId, Long chatRoomId) {
        List<String> history = getHistory(sessionId);
        for (String entry : history) {
            String[] parts = entry.split(":", 2);
            if (parts.length < 2) continue;
            chatDao.saveChat(Chat.builder()
                    .userId(userId)
                    .chatRoomId(chatRoomId)
                    .senderType(parts[0].trim())
                    .message(parts[1].trim())
                    .timestamp(LocalDateTime.now())
                    .build());
        }
        redisTemplate.delete(REDIS_PREFIX + sessionId);
    }

    private void saveMessage(String sessionId, String senderType, String message) {
        String key = REDIS_PREFIX + sessionId;
        try {
            Object raw = redisTemplate.opsForValue().get(key);
            String summary = "";
            List<String> recent = new ArrayList<>();

            if (raw != null) {
                Map<String, Object> parsed = objectMapper.readValue(raw.toString(), new TypeReference<>() {});
                summary = (String) parsed.getOrDefault("summary", "");
                recent = (List<String>) parsed.getOrDefault("recent", new ArrayList<>());
            }

            recent.add(senderType + ": " + message);
            if (recent.size() > 6) {
                String toSummarize = String.join("\n", recent.subList(0, recent.size() - 2));
                summary = summarize(toSummarize, summary);
                recent = recent.subList(recent.size() - 2, recent.size());
            }

            Map<String, Object> toStore = new HashMap<>();
            toStore.put("summary", summary);
            toStore.put("recent", recent);
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(toStore), SESSION_TTL);
        } catch (Exception e) {
            log.error("Redis 저장 실패", e);
        }
    }

    private List<String> getHistory(String sessionId) {
        Object raw = redisTemplate.opsForValue().get(REDIS_PREFIX + sessionId);
        if (raw == null) return new ArrayList<>();
        try {
            Map<String, Object> parsed = objectMapper.readValue(raw.toString(), new TypeReference<>() {});
            String summary = (String) parsed.getOrDefault("summary", "");
            List<String> recent = (List<String>) parsed.getOrDefault("recent", new ArrayList<>());
            List<String> full = new ArrayList<>();
            if (!summary.isBlank()) full.add("요약: " + summary);
            full.addAll(recent);
            return full;
        } catch (Exception e) {
            log.error("Redis 불러오기 실패", e);
            return new ArrayList<>();
        }
    }

    private String summarize(String newContent, String oldSummary) {
        try {
            String prompt = "다음은 이전 요약이야:\n" + oldSummary + "\n\n" +
                    "그리고 다음은 새로 들어온 대화야:\n" + newContent + "\n\n" +
                    "이 둘을 합쳐서 300자 이내로 간결하게 요약해줘.";
            return gmsAiClient.ask(prompt, "gpt-4o");
        } catch (Exception e) {
            log.warn("요약 실패, 이전 요약 유지", e);
            return oldSummary;
        }
    }

    private String convertToComicScenario(String conversationHistory) {
        try {
            String prompt = "다음 대화 내용을 분석해서 4컷 만화 시나리오로 변환해줘. 고슴도치 캐릭터가 주인공이고, 표정과 자세로만 감정을 표현해야 해.\n\n" +
                    "대화 내용:\n" + conversationHistory + "\n\n" +
                    "다음 형식으로 영어로 작성해줘:\n" +
                    "Panel 1: [peaceful/normal situation with hedgehog's expression and pose]\n" +
                    "Panel 2: [conflict or problem arises - hedgehog's reaction]\n" +
                    "Panel 3: [emotional peak or climax - hedgehog's intense expression]\n" +
                    "Panel 4: [resolution or aftermath - hedgehog's final state]\n\n" +
                    "각 패널은 고슴도치의 구체적인 표정(눈, 입, 전체적인 느낌)과 자세(앉기, 서기, 웅크리기 등)를 포함해서 설명해줘.";
            return gmsAiClient.ask(prompt, "gpt-4o");
        } catch (Exception e) {
            log.warn("만화 시나리오 변환 실패", e);
            return null;
        }
    }

    private String buildOptimizedDallePrompt(String scenario) {
        return """
           A 2x2 grid four-panel comic strip featuring the same cute chubby hedgehog character in all panels,
                with a round beige body, dense, short brown spines with a subtle sheen pointing outwards, large, round, sparkling black eyes, blush cheeks, a small, cute, button nose, and short limbs.
                Same proportions, features, and charming style in every panel.
                Minimal soft pastel background, identical soft ambient lighting with subtle shadows and highlights to emphasize the 3D form across all panels,
                background not distracting from characters.
                Smooth, soft-lit, pastel-colored 3D rendered style, award-winning adorable character design,
                consistent art style across all panels, visual storytelling through expressive poses and facial expressions only,
                no text, no labels, no speech balloons, professional heartwarming illustration quality.

            %s
            """.formatted(scenario);
    }


    private String buildPrompt(String mode, List<String> history, String input) {
        String joinedHistory = String.join("\n", history);
        String system = switch (mode) {
            case "COMFORT_ONLY" -> "너는 사용자를 100% 편들어주는 '편들기도치'야. 무조건 사용자 편에서 공감하고 위로해줘. " +
                    "해결책이나 조언은 절대 하지 말고, 오직 감정을 인정하고 공감만 해줘. " +
                    "예시: '정말 속상했겠다', '그럴 수밖에 없었어', '네 마음 충분히 이해해'. " +
                    "따뜻하고 다정한 말투로 응답해줘.";
            case "TIMELINE" -> "너는 갈등 상황을 분석하는 '분석도치'야. 대화 내용에서 일어난 사건들을 시간순으로 정리해줘. " +
                    "형식: '시간/상황: 무슨 일이 일어났는지' 형태로 핵심 사건만 간단명료하게 정리해줘. " +
                    "객관적이고 중립적인 톤으로 작성해줘.";
            case "COMIC" -> {
                String conversationContent = joinedHistory + "\n현재 질문: " + input;
                String scenario = convertToComicScenario(conversationContent);
                yield buildOptimizedDallePrompt(scenario);
            }
            default ->  "너는 갈등을 정리해주는 '정리도치'야. 사용자의 상황을 공감하면서도 객관적으로 분석하고, " +
                    "실용적인 해결방안을 제시해줘. 감정적 지지와 논리적 조언을 균형있게 제공해줘. " +
                    "친근하면서도 신뢰할 수 있는 톤으로 응답해줘.";

        };
        
        // COMIC 모드는 이미 완성된 프롬프트를 반환
        if ("COMIC".equals(mode)) {
            return system;
        }
        
        return system + "\n\n[이전 대화]\n" + joinedHistory + "\n\n[현재 질문]\n" + input;
    }

    public List<ChatRoom> getRooms(Long userId) {
        return chatDao.findAllRoomsByUserId(userId);
    }

    public List<Chat> getMessages(Long chatRoomId) {
        return chatDao.findAllByChatRoomId(chatRoomId);
    }

    @Transactional
    public void deleteRoom(Long chatRoomId) {
        chatDao.deleteMessagesByRoomId(chatRoomId);
        chatDao.deleteRoomById(chatRoomId);
    }


    @Transactional
    public void updateChatRoomTitle(Long chatRoomId, String newTitle) {
        chatDao.updateChatRoomTitle(chatRoomId, newTitle);
    }


}
