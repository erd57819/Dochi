package com.ssafy.dochi.chat.service;

import com.ssafy.dochi.chat.dao.ChatDao;
import org.springframework.ai.chat.client.ChatClient;

public class ChatService {
    private final ChatDao chatDao;
    private final ChatClient ragChatClient;
    private final UserrDao userrDao;
    private final ApartmentDao apartmentDao;
    private final RedisVectorStore redisVectorStore;
    private final RedisTemplate<String, Object> redisTemplate;
    private final CommunityService communityService;
    private final KakaoApiService kakaoApiService;
    private final ApartmentService apartmentService;
    private final DealService dealService;

}
