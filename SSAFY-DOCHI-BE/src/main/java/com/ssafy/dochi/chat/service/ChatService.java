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
        
        log.info("🎯 채팅 요청 수신: userId={}, sessionId={}, mode={}, messageLength={}", 
                 userId, sessionId, mode, dto.getMessage() != null ? dto.getMessage().length() : 0);
        
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
            log.info("🎨 COMIC 모드 시작: sessionId={}", sessionId);
            
            // 사용자 메시지 먼저 저장
            saveMessage(sessionId, "USER", dto.getMessage());
            log.info("✅ 사용자 메시지 저장 완료");
            
            // 동기 방식으로 이미지 생성 (GMS 토큰 한 번만 사용)
            try {
                log.info("🎨 네컷만화 생성 시작: prompt length={}", prompt.length());
                long startTime = System.currentTimeMillis();
                
                // 이미지 생성 시도 (동기)
                String imageUrl = null;
                try {
                    imageUrl = gmsImageClient.generateImage(prompt);
                    long imageGenTime = System.currentTimeMillis() - startTime;
                    log.info("✅ 이미지 생성 완료: imageUrl={}, 소요시간={}ms", imageUrl, imageGenTime);
                } catch (Exception imgError) {
                    log.error("❌ GMS 이미지 생성 실패: {}", imgError.getMessage(), imgError);
                    // 이미지 생성 실패 시 에러 메시지 반환
                    aiResponse = "ERROR:이미지 생성에 실패했습니다. GMS 토큰을 확인해주세요.";
                    description = "GMS 오류: " + imgError.getMessage();
                    
                    // 에러도 저장
                    saveMessage(sessionId, "BOT", aiResponse);
                    
                    return ChatResDto.builder()
                            .senderType("BOT")
                            .message(aiResponse)
                            .timestamp(LocalDateTime.now().toString())
                            .description(description)
                            .build();
                }
                
                // 대화 설명 생성
                String conversationContent = String.join("\n", history) + "\n현재 질문: " + dto.getMessage();
                String comicDescription = generateComicDescription(conversationContent);
                log.info("📝 만화 설명 생성 완료: {}", comicDescription);
                
                if (imageUrl != null && !imageUrl.isEmpty()) {
                    aiResponse = imageUrl;
                    description = comicDescription;
                    
                    // 성공 응답 저장
                    String finalResponse = imageUrl + "\n\n" + comicDescription;
                    saveMessage(sessionId, "BOT", finalResponse);
                    log.info("✅ 만화 생성 성공 및 저장 완료");
                } else {
                    aiResponse = "ERROR:이미지 URL을 받지 못했습니다.";
                    description = "이미지 생성 실패";
                    saveMessage(sessionId, "BOT", aiResponse);
                }
                
            } catch (Exception e) {
                log.error("❌ 만화 생성 전체 실패: sessionId={}, error={}", sessionId, e.getMessage(), e);
                aiResponse = "ERROR:만화 생성 중 오류가 발생했습니다.";
                description = e.getMessage();
                saveMessage(sessionId, "BOT", aiResponse);
            }
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
        try {
            log.info("💾 메시지 저장 시도: sessionId={}, senderType={}, messageLength={}", 
                     sessionId, senderType, message != null ? message.length() : 0);
            
            // sessionId로 chatRoomId 찾기
            ChatRoom chatRoom = findChatRoomBySessionId(sessionId);
            if (chatRoom != null) {
                log.info("✅ 채팅방 찾기 성공: chatRoomId={}", chatRoom.getId());
                
                // MySQL에 직접 저장
                Chat chat = Chat.builder()
                        .chatRoomId(chatRoom.getId())
                        .senderType(senderType)
                        .message(message)
                        .timestamp(LocalDateTime.now())
                        .build();
                
                chatDao.saveChat(chat);
                log.info("✅ 메시지 MySQL 저장 완료: sessionId={}, chatRoomId={}, senderType={}", 
                         sessionId, chatRoom.getId(), senderType);
            } else {
                log.warn("❌ 세션 ID {}에 해당하는 채팅방을 찾을 수 없습니다.", sessionId);
            }
        } catch (Exception e) {
            log.error("❌ MySQL 메시지 저장 실패: sessionId={}, senderType={}, error={}", 
                     sessionId, senderType, e.getMessage(), e);
        }
    }
    
    private ChatRoom findChatRoomBySessionId(String sessionId) {
        try {
            log.info("🔍 세션으로 채팅방 조회: sessionId={}", sessionId);
            List<ChatRoom> allRooms = chatDao.findAllRoomsByUserId(getCurrentUserId());
            log.info("📋 전체 채팅방 수: {}", allRooms.size());
            
            ChatRoom foundRoom = allRooms.stream()
                    .filter(room -> sessionId.equals(room.getSessionId()))
                    .findFirst()
                    .orElse(null);
                    
            if (foundRoom != null) {
                log.info("✅ 채팅방 찾기 성공: roomId={}, title={}", foundRoom.getId(), foundRoom.getTitle());
            } else {
                log.warn("❌ 해당 세션의 채팅방 없음: sessionId={}", sessionId);
                // 모든 세션 ID 로깅 (디버깅용)
                for (ChatRoom room : allRooms) {
                    log.debug("기존 채팅방: roomId={}, sessionId={}", room.getId(), room.getSessionId());
                }
            }
            
            return foundRoom;
        } catch (Exception e) {
            log.error("❌ 세션 ID로 채팅방 조회 실패: sessionId={}, error={}", sessionId, e.getMessage(), e);
            return null;
        }
    }
    
    private Long getCurrentUserId() {
        // 현재 인증된 사용자 ID 반환
        // 임시로 하드코딩, 실제로는 SecurityContext에서 가져와야 함
        return 4L; // 임시값
    }

    private List<String> getHistory(String sessionId) {
        try {
            // MySQL에서 대화 히스토리 조회
            List<Chat> messages = chatDao.getMessagesBySessionId(sessionId);
            
            List<String> history = new ArrayList<>();
            for (Chat chat : messages) {
                history.add(chat.getSenderType() + ": " + chat.getMessage());
            }
            
            // 최근 20개 메시지만 AI 컨텍스트로 사용 (성능 최적화)
            if (history.size() > 20) {
                return history.subList(history.size() - 20, history.size());
            }
            
            return history;
        } catch (Exception e) {
            log.error("MySQL 히스토리 조회 실패: sessionId={}, error={}", sessionId, e.getMessage(), e);
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
            case "COMFORT_ONLY" -> "너는 사용자를 100% 편들어주는 '참견도치'야. 무조건 사용자 편에서 공감하고 위로해줘. " +
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
            default ->  "너는 갈등을 정리해주는 '참견도치'야. 사용자의 상황을 공감하면서도 객관적으로 분석하고, " +
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
        try {
            // sessionId가 있으면 세션 ID로 조회 시도
            if (sessionId != null && !sessionId.isBlank()) {
                log.info("세션 ID {}의 대화 내역을 MySQL에서 조회 시도", sessionId);
                try {
                    List<Chat> messages = chatDao.getMessagesBySessionId(sessionId);
                    log.info("세션 ID {}에서 {}개의 메시지를 조회했습니다.", sessionId, messages.size());
                    return messages;
                } catch (Exception e) {
                    log.warn("세션 ID로 조회 실패, chatRoomId로 fallback: {}", e.getMessage());
                }
            }
            
            // sessionId 조회 실패 시 또는 sessionId가 없으면 chatRoomId로 조회
            log.info("chatRoomId {}의 대화 내역을 MySQL에서 조회합니다.", chatRoomId);
            List<Chat> sqlMessages = chatDao.findAllByChatRoomId(chatRoomId);
            log.info("chatRoomId {}에서 {}개의 메시지를 조회했습니다.", chatRoomId, sqlMessages.size());
            
            return sqlMessages;
        } catch (Exception e) {
            log.error("메시지 조회 실패: chatRoomId={}, sessionId={}, error={}", chatRoomId, sessionId, e.getMessage(), e);
            return new ArrayList<>(); // 빈 리스트 반환
        }
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