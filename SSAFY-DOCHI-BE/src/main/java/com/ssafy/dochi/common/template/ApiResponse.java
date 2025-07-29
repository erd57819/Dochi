package com.ssafy.dochi.common.template;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;

import java.io.Serializable;

@Getter
public class ApiResponse<B> extends ResponseEntity<B> {

    public ApiResponse(final HttpStatus status){
        super(status);
    }

    public ApiResponse(final B body, final HttpStatus status) {
        super(body, status);
    }

    public ApiResponse(final B body, MultiValueMap<String, String> headers, HttpStatus status) {
        super(body, headers, status);
    }

    @Getter
    @AllArgsConstructor
    @Builder
    public static class FailureCustomBody implements Serializable {

        private int status;
        private String message;
        private String data;
    }

    @Getter
    @AllArgsConstructor
    public static class SuccessCustomBody<D> implements Serializable {
        private int status;
        private String message;
        private D data;
    }


}
