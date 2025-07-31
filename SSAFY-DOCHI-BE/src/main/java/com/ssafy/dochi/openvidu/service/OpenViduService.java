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
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OpenViduService {

    @Value("${livekit.api.key}")
    private String apiKey;

    @Value("${livekit.api.secret}")
    private String apiSecret;

    private final UserSessionDao userSessionDao;

    // LiveKit용 JWT 생성
    public String createToken(String roomName, String identity, List<String> permissions, Long userId) {
        try {
            Map<String, Object> videoClaims = Map.of(
                    "room", roomName,
                    "identity", identity,
                    "permissions", permissions
            );

            Date now = new Date();
            Date exp = new Date(now.getTime() + 1000L * 60 * 60); // 1시간

            Key key = Keys.hmacShaKeyFor(apiSecret.getBytes(StandardCharsets.UTF_8));

            userSessionDao.insertSession(UserSession.builder()
                    .sessionId(roomName)
                    .userId(userId)
                    .expiresAt(exp.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime())
                    .build());


            return Jwts.builder()
                    .setSubject(apiKey)
                    .claim("video", videoClaims)
                    .setIssuedAt(now)
                    .setExpiration(exp)
                    .signWith(key, SignatureAlgorithm.HS256)
                    .compact();
        } catch (Exception e) {
            throw new OpenViduException("LiveKit 토큰 생성 실패", e);
        }
    }
}
