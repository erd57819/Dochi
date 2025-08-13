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
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
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
    private static final String COMIC_STATUS_PREFIX = "comic_status:";

    public Long createChatRoom(Long userId, String title) {
        String sessionId = "session_" + UUID.randomUUID().toString();

        ChatRoom room = ChatRoom.builder()
                .userId(userId)
                .title(title)
                .sessionId(sessionId)
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
            try {
                log.info("🎨 네컷만화 생성 시작");
                String imageUrl = gmsImageClient.generateImage(prompt);
                log.info("✅ 이미지 생성 완료: {}", imageUrl);
                
                String conversationContent = String.join("\n", history) + "\n현재 질문: " + dto.getMessage();
                String description = generateComicDescription(conversationContent);
                
                // 이미지 URL만 반환 (설명은 별도로 처리할 수 있음)
                aiResponse = imageUrl;
                
                saveMessage(sessionId, "USER", dto.getMessage());
                saveMessage(sessionId, "BOT", aiResponse);
                
            } catch (Exception e) {
                log.error("❌ 만화 생성 실패", e);
                aiResponse = "만화 생성에 실패했습니다. 다시 시도해주세요.";
                
                saveMessage(sessionId, "USER", dto.getMessage());
                saveMessage(sessionId, "BOT", aiResponse);
            }
        } else {
            aiResponse = gmsAiClient.ask(prompt, "gpt-4o");
            saveMessage(sessionId, "USER", dto.getMessage());
            saveMessage(sessionId, "BOT", aiResponse);
        }
        
        if (!"COMIC".equals(dto.getMode())) {
            saveMessage(sessionId, "USER", dto.getMessage());
        }
        
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
            String prompt = """
                    You are an expert scriptwriter creating a 4-panel comic story based on the user's real conversation.
                    
                    MISSION: Analyze the conversation and create a specific 4-panel story featuring a hedgehog character.
                    
                    STRICT REQUIREMENTS:
                    1. Use ONLY the actual events, people, situations mentioned in the conversation
                    2. Extract the EXACT emotional journey from start to current state
                    3. Include SPECIFIC details: names, places, events, relationships mentioned
                    4. NO generic scenarios - this must be THEIR specific story
                    
                    [User's Conversation]
                    %s
                    
                    ANALYSIS STEPS:
                    1. Identify the main conflict/situation from the conversation
                    2. Find the specific people involved (friend, family, coworker, etc.)
                    3. Track the emotional progression through the conversation
                    4. Determine current emotional state and what they want
                    
                    OUTPUT FORMAT - 4 Panels with hedgehog as main character:
                    
                    Panel 1: [Initial situation before conflict - set the scene with specific context from conversation. Include hedgehog's starting emotional state, detailed facial expression (eyes, mouth, eyebrows), body pose, and environmental setting mentioned in conversation]
                    
                    Panel 2: [The exact conflict/event described - what specifically happened with whom. Show hedgehog's immediate reaction with detailed facial expression changes, body language shift, and include the specific situation/people from conversation]
                    
                    Panel 3: [Peak emotional moment from conversation - the strongest feeling expressed (anger, hurt, disappointment, etc.). Show hedgehog's intense emotional expression with very detailed face and body language reflecting this specific emotion]
                    
                    Panel 4: [Current state or desired outcome mentioned in conversation - where they are now emotionally or what they hope happens next. Show hedgehog's final emotional state with detailed expression and pose]
                    
                    CRITICAL: Each panel must include hedgehog's detailed facial features (eye shape, mouth position, eyebrow angle) and full body pose (sitting/standing/curled/leaning etc.)
                    """.formatted(conversationHistory);

            return gmsAiClient.ask(prompt, "gpt-4o");
        } catch (Exception e) {
            log.warn("만화 시나리오 변환 실패", e);
            return null;
        }
    }

    private String generateComicDescription(String conversationContent) {
        try {
            String prompt = """
                    다음 대화 내용을 바탕으로 4컷 만화에 대한 한 줄 설명을 생성해줘.
                    설명은 친근하고 따뜻한 톤으로 작성하고, "~을 4컷 만화로 표현했어요" 형식으로 끝내줘.
                    
                    대화 내용:
                    %s
                    
                    예시:
                    - "친구와의 갈등 상황을 4컷 만화로 표현했어요"
                    - "오늘 있었던 힘든 일을 4컷 만화로 그려봤어요"
                    - "복잡한 감정들을 4컷 만화로 담아봤어요"
                    """.formatted(conversationContent);

            return gmsAiClient.ask(prompt, "gpt-4o");
        } catch (Exception e) {
            log.warn("만화 설명 생성 실패", e);
            return "당신의 이야기를 4컷 만화로 표현했어요";
        }
    }

    private String buildOptimizedDallePrompt(String scenario) {
        return """
               Create a heartwarming 2x2 grid four-panel comic strip (yonkoma style) featuring the same adorable hedgehog character throughout all panels.
               
               CHARACTER CONSISTENCY (CRITICAL - must be identical in all panels):
               - Round, chubby hedgehog with soft beige/cream colored body
               - Short, dense brown spines with natural sheen, pointing outward in a cute crown pattern
               - Large, expressive round black eyes that sparkle with emotion
               - Small pink button nose, rosy blush cheeks
               - Tiny stubby limbs, perfectly proportioned for maximum cuteness
               - Same exact size, proportions, and coloring in every single panel
               
               VISUAL STYLE REQUIREMENTS:
               - Clean, modern 3D rendered cartoon style with soft lighting
               - Gentle pastel color palette with warm, comforting tones
               - Minimal, non-distracting backgrounds that support the story
               - Professional animation quality with smooth gradients and subtle shadows
               - Each panel clearly defined with thin borders
               - NO text, NO speech bubbles, NO labels - pure visual storytelling
               
               LIGHTING & COMPOSITION:
               - Consistent soft ambient lighting across all panels
               - Each panel should have identical lighting direction and intensity
               - Gentle highlights on the hedgehog's spines and cheeks
               - Warm, welcoming atmosphere throughout
               
               STORY STRUCTURE (Kishōtenketsu - traditional 4-panel flow):
               Panel 1 (Setup): %s
               Panel 2 (Development): %s  
               Panel 3 (Twist/Climax): %s
               Panel 4 (Resolution): %s
               
               Focus on the hedgehog's facial expressions and body language to convey the emotional journey. Make this a touching, relatable story that viewers can connect with emotionally.
               """.formatted(
                   scenario.contains("Panel 1:") ? scenario.substring(scenario.indexOf("Panel 1:"), scenario.indexOf("Panel 2:")).replace("Panel 1:", "").trim() : "hedgehog in peaceful starting situation",
                   scenario.contains("Panel 2:") ? scenario.substring(scenario.indexOf("Panel 2:"), scenario.indexOf("Panel 3:")).replace("Panel 2:", "").trim() : "conflict or change occurs",
                   scenario.contains("Panel 3:") ? scenario.substring(scenario.indexOf("Panel 3:"), scenario.indexOf("Panel 4:")).replace("Panel 3:", "").trim() : "emotional peak moment",
                   scenario.contains("Panel 4:") ? scenario.substring(scenario.indexOf("Panel 4:")).replace("Panel 4:", "").trim() : "resolution and peace"
               );
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

                if (scenario == null || scenario.isBlank()) {
                    scenario = "A hedgehog is just sitting there looking cute.";
                }

                yield buildOptimizedDallePrompt(scenario);
            }
            default ->  "너는 갈등을 정리해주는 '정리도치'야. 사용자의 상황을 공감하면서도 객관적으로 분석하고, " +
                    "실용적인 해결방안을 제시해줘. 감정적 지지와 논리적 조언을 균형있게 제공해줘. " +
                    "친근하면서도 신뢰할 수 있는 톤으로 응답해줘.";
        };
        
        if ("COMIC".equals(mode)) {
            return system;
        }
        
        return system + "\n\n[이전 대화]\n" + joinedHistory + "\n\n[현재 질문]\n" + input;
    }

    public List<ChatRoom> getRooms(Long userId) {
        return chatDao.findAllRoomsByUserId(userId);
    }

    public List<Chat> getMessages(Long chatRoomId, String sessionId) {
        if (sessionId != null && !sessionId.isBlank()) {
            List<Chat> redisMessages = getMessagesFromRedis(sessionId);
            if (!redisMessages.isEmpty()) {
                log.info("활성 세션 {}의 대화 내역을 Redis에서조회했습니다.", sessionId);
                return redisMessages;
            }
        }
        log.info("chatRoomId {}의 대화 내역을 MySQL에서 조회합니다.", chatRoomId);
        return chatDao.findAllByChatRoomId(chatRoomId);
    }

    private List<Chat> getMessagesFromRedis(String sessionId) {
        List<String> historyWithSummary = getHistory(sessionId);
        if (historyWithSummary.isEmpty()) {
            return Collections.emptyList();
        }
        List<Chat> messages = new ArrayList<>();
        long tempId = 1L;
        for (String entry : historyWithSummary) {
            if (entry.startsWith("요약:")) {
                continue;
            }
            String[] parts = entry.split(":", 2);
            if (parts.length < 2) continue;
            messages.add(Chat.builder()
                    .id(tempId++)
                    .senderType(parts[0].trim())
                    .message(parts[1].trim())
                    .timestamp(LocalDateTime.now())
                    .build());
        }
        return messages;
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

    private void setComicStatus(String comicId, String status, String message, String imageUrl) {
        try {
            Map<String, String> statusData = new HashMap<>();
            statusData.put("status", status);
            statusData.put("message", message);
            if (imageUrl != null) {
                statusData.put("imageUrl", imageUrl);
            }
            statusData.put("timestamp", LocalDateTime.now().toString());
            
            redisTemplate.opsForValue().set(
                COMIC_STATUS_PREFIX + comicId, 
                objectMapper.writeValueAsString(statusData), 
                Duration.ofMinutes(10)
            );
        } catch (Exception e) {
            log.error("만화 상태 저장 실패", e);
        }
    }

    public Map<String, String> getComicStatus(String comicId) {
        try {
            Object raw = redisTemplate.opsForValue().get(COMIC_STATUS_PREFIX + comicId);
            if (raw != null) {
                return objectMapper.readValue(raw.toString(), new TypeReference<>() {});
            }
        } catch (Exception e) {
            log.error("만화 상태 조회 실패", e);
        }
        return Map.of("status", "NOT_FOUND", "message", "만화 생성 상태를 찾을 수 없습니다.");
    }
}