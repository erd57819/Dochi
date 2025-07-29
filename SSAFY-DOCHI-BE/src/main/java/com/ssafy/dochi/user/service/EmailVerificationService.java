package com.ssafy.dochi.user.service;

import com.ssafy.dochi.user.dao.EmailVerificationDao;
import com.ssafy.dochi.user.domain.EmailVerification;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {
    private final EmailVerificationDao emailVerificationDao;
    private final EmailSender emailSender;

    // 인증 코드 생성 및 이메일 발송
    public void sendVerificationCode(String email) {
        String code = generateCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);

        emailVerificationDao.upsertCode(email, code, expiresAt);
        emailSender.send(email, "[Dochi] 이메일 인증 코드", "인증번호: " + code);
    }

    // 인증 코드 검증
    public void verifyCode(String email, String inputCode) {
        EmailVerification verification = emailVerificationDao.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("인증 요청 내역이 없습니다."));

        if (verification.isVerified()) throw new IllegalStateException("이미 인증된 이메일입니다.");
        if (verification.getExpiresAt().isBefore(LocalDateTime.now()))
            throw new IllegalArgumentException("인증 코드가 만료되었습니다.");
        if (!verification.getVerificationCode().equals(inputCode))
            throw new IllegalArgumentException("인증 코드가 일치하지 않습니다.");

        emailVerificationDao.markAsVerified(email);
    }

    private String generateCode() {
        return String.format("%06d", new Random().nextInt(999999));
    }
}
