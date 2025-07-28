package com.ssafy.dochi.user.service;


public interface EmailSender {
    void send(String to, String subject, String content);
}
