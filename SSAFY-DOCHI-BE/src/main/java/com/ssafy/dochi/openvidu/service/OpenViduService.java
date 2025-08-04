package com.ssafy.dochi.openvidu.service;

import com.ssafy.dochi.openvidu.dao.UserSessionDao;
import com.ssafy.dochi.openvidu.domain.UserSession;
import com.ssafy.dochi.openvidu.exception.OpenViduException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OpenViduService {

    @Value("${livekit.api.key}")
    private String livekitApiKey;

    @Value("${livekit.api.secret}")
    private String livekitApiSecret;

    private final UserSessionDao userSessionDao;

    // LiveKit용 토큰 생성
    public String createToken(String roomName, String identity, List<String> permissions, Long userId) {
        try {
            // JWT 클레임 설정
            Map<String, Object> claims = new HashMap<>();
            claims.put("iss", livekitApiKey);
            claims.put("sub", identity);
            claims.put("name", identity);
            
            // LiveKit 권한 설정
            Map<String, Object> video = new HashMap<>();
            video.put("room", roomName);
            video.put("roomJoin", true);
            video.put("canPublish", true);
            video.put("canSubscribe", true);
            video.put("canPublishData", true);
            claims.put("video", video);
            
            // 1시간 후 만료
            Date expiration = new Date(System.currentTimeMillis() + 3600 * 1000);
            
            // JWT 시크릿 키 생성
            Key key = Keys.hmacShaKeyFor(livekitApiSecret.getBytes(StandardCharsets.UTF_8));
            
            // JWT 토큰 생성
            String token = Jwts.builder()
                    .setClaims(claims)
                    .setExpiration(expiration)
                    .signWith(key, SignatureAlgorithm.HS256)
                    .compact();
            
            // 인증된 사용자만 세션 저장
            if (userId != null) {
                userSessionDao.insertSession(UserSession.builder()
                        .sessionId(roomName)
                        .userId(userId)
                        .expiresAt(LocalDateTime.now().plusHours(1))
                        .build());
            }

            return token;
        } catch (Exception e) {
            throw new OpenViduException("LiveKit 토큰 생성 실패", e);
        }
    }
}
