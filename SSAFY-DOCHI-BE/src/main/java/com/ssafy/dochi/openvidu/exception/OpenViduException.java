package com.ssafy.dochi.openvidu.exception;

public class OpenViduException extends RuntimeException {
    public OpenViduException(String message, Throwable cause) {
        super(message, cause);
    }

    public OpenViduException(String message) {
        super(message);
    }
}
