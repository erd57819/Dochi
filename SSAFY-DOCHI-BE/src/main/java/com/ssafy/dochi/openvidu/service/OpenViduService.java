package com.ssafy.dochi.openvidu.service;

import com.ssafy.dochi.openvidu.dao.UserSessionDao;
import com.ssafy.dochi.openvidu.domain.UserSession;
import com.ssafy.dochi.openvidu.exception.OpenViduException;
import io.openvidu.java.client.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OpenViduService {

    @Value("${openvidu.url}")
    private String openviduUrl;

    @Value("${openvidu.secret}")
    private String openviduSecret;

    private final UserSessionDao userSessionDao;

    // OpenVidu용 토큰 생성
    public String createToken(String roomName, String identity, List<String> permissions, Long userId) {
        try {
            // OpenVidu 객체 생성
            OpenVidu openVidu = new OpenVidu(openviduUrl, openviduSecret);
            
            // 세션 생성 또는 가져오기
            Session session = openVidu.getActiveSession(roomName);
            if (session == null) {
                SessionProperties sessionProperties = new SessionProperties.Builder()
                        .customSessionId(roomName)
                        .build();
                session = openVidu.createSession(sessionProperties);
            }
            
            // 연결 속성 설정
            ConnectionProperties connectionProperties = new ConnectionProperties.Builder()
                    .type(ConnectionType.WEBRTC)
                    .data("user_data=" + identity)
                    .role(OpenViduRole.PUBLISHER)
                    .build();
            
            // 토큰 생성
            Connection connection = session.createConnection(connectionProperties);
            String token = connection.getToken();
            
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
            throw new OpenViduException("OpenVidu 토큰 생성 실패", e);
        }
    }
}
