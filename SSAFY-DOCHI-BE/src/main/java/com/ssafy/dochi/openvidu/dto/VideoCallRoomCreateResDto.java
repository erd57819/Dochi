package com.ssafy.dochi.openvidu.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VideoCallRoomCreateResDto {
    private String roomCode;
    private String token;
    private Long conflictId;
}