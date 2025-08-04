package com.ssafy.dochi.chat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.dochi.chat.dao.ChatDao;
import com.ssafy.dochi.chat.domain.Chat;
import com.ssafy.dochi.chat.domain.ChatRoom;
import com.ssafy.dochi.chat.dto.request.ChatReqDto;
import com.ssafy.dochi.chat.dto.response.ChatResDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final ChatDao chatDao;
    private final ChatClient chatClient;

    private static final Duration SESSION_TTL = Duration.ofHours(2);
    private static final String REDIS_PREFIX = "chat:";

    public Long createChatRoom(Long userId, String title) {
        ChatRoom room = ChatRoom.builder()
                .userId(userId)
                .title(title)
                .createdAt(LocalDateTime.now())
                .build();

        chatDao.saveChatRoom(room); // keyProperty="id"로 id 자동 세팅됨
        return room.getId();
    }

    public ChatResDto chat(Long userId, ChatReqDto dto) {
        String sessionId = dto.getSessionId();
        List<String> history = getHistory(sessionId);

        String prompt = buildPrompt(dto.getMode(), history, dto.getMessage());
        String aiResponse = chatClient.prompt().user(prompt).call().content();

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
        List<String> history = getHistory(sessionId);
        history.add(senderType + ": " + message);
        try {
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(history), SESSION_TTL);
        } catch (Exception e) {
            log.error("Redis 저장 실패", e);
        }
    }

    private List<String> getHistory(String sessionId) {
        Object raw = redisTemplate.opsForValue().get(REDIS_PREFIX + sessionId);
        if (raw == null) return new ArrayList<>();
        try {
            return objectMapper.readValue(raw.toString(), new TypeReference<>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String buildPrompt(String mode, List<String> history, String input) {
        String joinedHistory = String.join("\n", history);
        String system = switch (mode) {
            case "COMFORT_ONLY" -> "너는 무조건 따뜻하게 공감해주는 AI야. 판단하지 마.";
            case "TIMELINE" -> "갈등의 시기별 흐름을 질문을 통해 정리해줘.";
            case "COMIC" -> "다음 대화를 네컷 만화로 정리해줘. 각 컷은 상황을 묘사하고, 마지막 컷은 감정적으로 마무리해줘.";
            default -> "너는 갈등 조언자야. 사용자에게 공감하고 구체적인 조언을 줘.";
        };
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

}