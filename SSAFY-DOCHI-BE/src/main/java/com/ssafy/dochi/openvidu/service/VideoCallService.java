package com.ssafy.dochi.openvidu.service;

import com.ssafy.dochi.openvidu.dto.VideoCallRoomCreateReqDto;
import com.ssafy.dochi.openvidu.dto.VideoCallRoomCreateResDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VideoCallService {

    private final OpenViduService openViduService;

    public VideoCallRoomCreateResDto createRoom(VideoCallRoomCreateReqDto request, Long userId) {
        // 방 코드 생성 (UUID 기반)
        String roomCode = generateRoomCode();
        
        // 사용자 ID 기반 identity 생성
        String identity = "user-" + userId;
        
        // LiveKit 토큰 생성
        String token = openViduService.createToken(
                roomCode,
                identity,
                List.of("join", "publish", "subscribe"),
                userId
        );

        return VideoCallRoomCreateResDto.builder()
                .roomCode(roomCode)
                .token(token)
                .conflictId(request.getConflictId())
                .build();
    }

    public String joinRoom(String roomCode, Long userId) {
        // 사용자 ID 기반 identity 생성
        String identity = "user-" + userId;
        
        // LiveKit 토큰 생성
        return openViduService.createToken(
                roomCode,
                identity,
                List.of("join", "publish", "subscribe"),
                userId
        );
    }

    public Object getRoomInfo(String roomCode) {
        // 방 정보 조회 로직 (현재는 기본 정보만 반환)
        return new Object() {
            public String getRoomCode() { return roomCode; }
            public String getStatus() { return "active"; }
        };
    }

    public boolean endCall(String roomCode) {
        // 통화 종료 로직 (현재는 성공으로 반환)
        return true;
    }

    private String generateRoomCode() {
        // UUID를 사용해 고유한 방 코드 생성
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
}