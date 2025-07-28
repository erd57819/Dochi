package com.ssafy.dochi.common.security.exception;

import lombok.Getter;

@Getter
public class UnAuthorizedException extends Exception {
    private final String message;

    public UnAuthorizedException(String message) {
        this.message = message;
    }
}
