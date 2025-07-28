package com.ssafy.dochi.user.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailSenderImpl implements EmailSender {

    private final JavaMailSender mailSender;
    @Value("${spring.mail.username}")
    private String fromAddress;
    @Override
    public void send(String to, String subject, String content) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, false);
            helper.setFrom(fromAddress);

            mailSender.send(message);
            log.info(" 이메일 전송 완료 → {}", to);
        } catch (MessagingException e) {
            log.error("이메일 전송 실패: {}", e.getMessage());
            throw new RuntimeException("이메일 전송 중 오류가 발생했습니다.");
        }
    }
}
