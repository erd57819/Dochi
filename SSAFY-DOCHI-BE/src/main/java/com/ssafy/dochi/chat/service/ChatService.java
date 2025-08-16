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
        String mode = dto.getMode();
        
        // 캐시 확인 모드들
        if ("TIMELINE_CHECK".equals(mode)) {
            String timelineKey = "timeline_cache:" + sessionId;
            Object timelineData = redisTemplate.opsForValue().get(timelineKey);
            String response = timelineData != null ? timelineData.toString() : "NO_CACHE";
            return ChatResDto.builder()
                    .senderType("SYSTEM")
                    .message(response)
                    .timestamp(LocalDateTime.now().toString())
                    .build();
        }
        
        if ("MANHWA_CHECK".equals(mode)) {
            String manhwaKey = "manhwa_cache:" + sessionId;
            Object manhwaData = redisTemplate.opsForValue().get(manhwaKey);
            String response = manhwaData != null ? manhwaData.toString() : "NO_CACHE";
            return ChatResDto.builder()
                    .senderType("SYSTEM")
                    .message(response)
                    .timestamp(LocalDateTime.now().toString())
                    .build();
        }
        
        List<String> history = getHistory(sessionId);
        String prompt = buildPrompt(mode, history, dto.getMessage());
        String aiResponse;
        String description = null;
        
        if ("COMIC".equals(mode)) {
            String comicId = "comic_" + UUID.randomUUID().toString();
            
            setComicStatus(comicId, "GENERATING", "4컷 만화를 생성하고 있어요...", null);
            
            CompletableFuture.runAsync(() -> {
                try {
                    log.info("🎨 네컷만화 생성 시작");
                    String imageUrl = gmsImageClient.generateImage(prompt);
                    log.info("✅ 이미지 생성 완료: {}", imageUrl);
                    
                    String conversationContent = String.join("\n", history) + "\n현재 질문: " + dto.getMessage();
                    String comicDescription = generateComicDescription(conversationContent);
                    String finalResponse = imageUrl + "\n\n" + comicDescription;
                    
                    setComicStatus(comicId, "COMPLETED", comicDescription, imageUrl);
                    
                    saveMessage(sessionId, "BOT", finalResponse);
                } catch (Exception e) {
                    log.error("❌ 만화 생성 실패", e);
                    setComicStatus(comicId, "FAILED", "만화 생성에 실패했습니다. 다시 시도해주세요.", null);
                }
            });
            
            aiResponse = "COMIC_GENERATING:" + comicId;
        } else {
            aiResponse = gmsAiClient.ask(prompt, "claude-3-7-sonnet-latest");
            saveMessage(sessionId, "USER", dto.getMessage());
            saveMessage(sessionId, "BOT", aiResponse);
        }
        
        return ChatResDto.builder()
                .senderType("BOT")
                .message(aiResponse)
                .timestamp(LocalDateTime.now().toString())
                .description(description)
                .build();
    }

    public void saveToDatabase(Long userId, String sessionId, Long chatRoomId) {
        try {
            log.info("대화 저장 시작: userId={}, sessionId={}, chatRoomId={}", userId, sessionId, chatRoomId);
            
            List<String> history = getHistory(sessionId);
            log.info("Redis에서 가져온 대화 기록 개수: {}", history.size());
            
            if (history.isEmpty()) {
                log.warn("저장할 대화 내용이 없습니다. sessionId: {}", sessionId);
                return;
            }
            
            int savedCount = 0;
            for (String entry : history) {
                if (entry.startsWith("요약:")) {
                    continue; // 요약은 저장하지 않음
                }
                
                String[] parts = entry.split(":", 2);
                if (parts.length < 2) {
                    log.warn("잘못된 메시지 형식 무시: {}", entry);
                    continue;
                }
                
                try {
                    chatDao.saveChat(Chat.builder()
                            .userId(userId)
                            .chatRoomId(chatRoomId)
                            .senderType(parts[0].trim())
                            .message(parts[1].trim())
                            .timestamp(LocalDateTime.now())
                            .build());
                    savedCount++;
                } catch (Exception e) {
                    log.error("개별 메시지 저장 실패: {}, 에러: {}", entry, e.getMessage());
                }
            }
            
            log.info("대화 저장 완료: {}개 메시지 저장됨", savedCount);
            
            // 저장 성공 후 Redis에서 삭제
            redisTemplate.delete(REDIS_PREFIX + sessionId);
            log.info("Redis 세션 삭제 완료: {}", sessionId);
            
        } catch (Exception e) {
            log.error("대화 저장 중 전체 에러 발생: userId={}, sessionId={}, chatRoomId={}, 에러: {}", 
                     userId, sessionId, chatRoomId, e.getMessage(), e);
            throw new RuntimeException("대화 저장에 실패했습니다: " + e.getMessage(), e);
        }
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
            if (recent.size() > 10) {  // 더 많은 메시지를 유지 (6 -> 10)
                String toSummarize = String.join("\n", recent.subList(0, recent.size() - 6));
                summary = summarize(toSummarize, summary);
                recent = recent.subList(recent.size() - 6, recent.size()); // 최근 6개 메시지 유지 (2 -> 6)
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
                    "이 둘을 합쳐서 500자 이내로 상세하게 요약해줘. 중요한 감정이나 구체적인 상황은 빠뜨리지 말고 포함해줘.";
            return gmsAiClient.ask(prompt, "claude-3-7-sonnet-latest");
        } catch (Exception e) {
            log.warn("요약 실패, 이전 요약 유지", e);
            return oldSummary;
        }
    }

    private String convertToComicScenario(String conversationHistory) {
        try {
            String prompt = """
            You must create a **4-panel comic scenario** STRICTLY based on the conversation below.

            RULES:
            - Use ONLY people, places, events, and situations explicitly mentioned in the conversation.
            - Do NOT add fictional details or generic scenarios.
            - If something is not mentioned, leave it out — do NOT invent.
            - Focus on the factual sequence of events and situations.

            STEP 1 — Extract key facts as a table:
            | Step | Exact Event | People Involved | Location | Situation |
            |------|-------------|-----------------|----------|-----------|
            (Fill from conversation, only exact words used by user)

            STEP 2 — Write the scenario in this format:
            Panel 1: (Describe initial situation based ONLY on table)
            Panel 2: (Describe the specific event/conflict situation)
            Panel 3: (Describe the key situation moment)
            Panel 4: (Describe the current state or resolution situation)

            Conversation:
            %s
            """.formatted(conversationHistory);

            return gmsAiClient.ask(prompt, "claude-3-7-sonnet-latest");
        } catch (Exception e) {
            log.warn("만화 시나리오 변환 실패", e);
            return null;
        }
    }

    private String validateScenario(String conversation, String scenario) {
        String prompt = """
        Check if the scenario below matches ONLY the events, people, and emotions from the conversation. 
        If anything is invented, rewrite it to remove invented parts.

        Conversation:
        %s

        Scenario:
        %s
        """.formatted(conversation, scenario);
        return gmsAiClient.ask(prompt, "claude-3-7-sonnet-latest");
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

            return gmsAiClient.ask(prompt, "claude-3-7-sonnet-latest");
        } catch (Exception e) {
            log.warn("만화 설명 생성 실패", e);
            return "당신의 이야기를 4컷 만화로 표현했어요";
        }
    }

    private String buildOptimizedDallePrompt(String scenario) {
        return """
               Create a heartwarming 2x2 grid four-panel comic strip (yonkoma style) featuring the same adorable hedgehog character throughout all panels.
               
               CRITICAL FORMAT REQUIREMENTS:
               - EXACTLY 4 panels arranged in 2x2 grid format
               - NO text, NO speech bubbles, NO labels, NO written words - pure visual storytelling only
               - Each panel clearly defined with thin borders
               
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
        List<Chat> sqlMessages = chatDao.findAllByChatRoomId(chatRoomId);
        
        // SQL에서 가져온 대화가 있고 sessionId가 있다면 Redis로 복원
        if (!sqlMessages.isEmpty() && sessionId != null && !sessionId.isBlank()) {
            restoreSqlMessagesToRedis(sqlMessages, sessionId);
            log.info("SQL 대화 {}개를 Redis 세션 {}으로 복원했습니다.", sqlMessages.size(), sessionId);
        }
        
        return sqlMessages;
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
    
    private void restoreSqlMessagesToRedis(List<Chat> sqlMessages, String sessionId) {
        try {
            log.info("SQL 대화 복원 시작: {} 개 메시지를 세션 {}로 복원", sqlMessages.size(), sessionId);
            
            // SQL 메시지를 Redis 형식으로 변환
            List<String> messageEntries = new ArrayList<>();
            for (Chat chat : sqlMessages) {
                messageEntries.add(chat.getSenderType() + ": " + chat.getMessage());
            }
            
            // Redis에 저장할 데이터 구조 생성
            Map<String, Object> toStore = new HashMap<>();
            
            if (messageEntries.size() > 10) {
                log.info("메시지가 많아 요약 처리 시작: {} 개 메시지", messageEntries.size());
                try {
                    // 메시지가 많으면 요약 처리
                    String toSummarize = String.join("\n", messageEntries.subList(0, messageEntries.size() - 6));
                    String summary = summarize(toSummarize, "");
                    List<String> recent = messageEntries.subList(messageEntries.size() - 6, messageEntries.size());
                    
                    toStore.put("summary", summary);
                    toStore.put("recent", recent);
                    log.info("요약 처리 완료");
                } catch (Exception summaryError) {
                    log.error("요약 처리 실패, 모든 메시지를 recent에 저장: {}", summaryError.getMessage());
                    // 요약 실패 시 모든 메시지를 recent에 저장 (최대 10개만)
                    toStore.put("summary", "");
                    toStore.put("recent", messageEntries.subList(Math.max(0, messageEntries.size() - 10), messageEntries.size()));
                }
            } else {
                // 메시지가 적으면 모두 recent에 저장
                toStore.put("summary", "");
                toStore.put("recent", messageEntries);
                log.info("적은 메시지 수, 모두 recent에 저장: {} 개", messageEntries.size());
            }
            
            // Redis에 저장
            String key = REDIS_PREFIX + sessionId;
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(toStore), SESSION_TTL);
            
            log.info("SQL 대화 {}개를 Redis 세션 {}으로 복원 완료", sqlMessages.size(), sessionId);
        } catch (Exception e) {
            log.error("SQL 대화를 Redis로 복원하는데 실패했습니다: sessionId={}, 에러={}", sessionId, e.getMessage(), e);
            // 복원 실패 시에도 원본 SQL 메시지는 반환되도록 예외를 다시 던지지 않음
        }
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