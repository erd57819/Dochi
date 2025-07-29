package com.ssafy.dochi.user.service;

import com.ssafy.dochi.user.dao.EmailVerificationDao;
import com.ssafy.dochi.user.domain.EmailVerification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {
    private final EmailVerificationDao emailVerificationDao;
    private final EmailSender emailSender;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String EMAIL_CODE_PREFIX = "email_code:";
    private static final String EMAIL_VERIFIED_PREFIX = "email_verified:";
    private static final int CODE_EXPIRATION_MINUTES = 5;

    // 인증 코드 생성 및 이메일 발송 (Redis 사용)
    public void sendVerificationCode(String email) {
        String code = generateCode();
        String codeKey = EMAIL_CODE_PREFIX + email;
        
        // Redis에 인증 코드 저장 (5분 TTL)
        redisTemplate.opsForValue().set(codeKey, code, CODE_EXPIRATION_MINUTES, TimeUnit.MINUTES);
        
        // 기존 인증 상태 제거
        String verifiedKey = EMAIL_VERIFIED_PREFIX + email;
        redisTemplate.delete(verifiedKey);
        
        emailSender.send(email, "[Dochi] 이메일 인증 코드", "인증번호: " + code);
    }

    // 인증 코드 검증 (Redis 사용)
    public void verifyCode(String email, String inputCode) {
        String codeKey = EMAIL_CODE_PREFIX + email;
        String verifiedKey = EMAIL_VERIFIED_PREFIX + email;
        
        // 이미 인증된 이메일인지 확인
        if (Boolean.TRUE.equals(redisTemplate.hasKey(verifiedKey))) {
            throw new IllegalStateException("이미 인증된 이메일입니다.");
        }
        
        // Redis에서 인증 코드 조회
        String storedCode = (String) redisTemplate.opsForValue().get(codeKey);
        if (storedCode == null) {
            throw new IllegalArgumentException("인증 코드가 만료되었거나 요청 내역이 없습니다.");
        }
        
        // 인증 코드 검증
        if (!storedCode.equals(inputCode)) {
            throw new IllegalArgumentException("인증 코드가 일치하지 않습니다.");
        }
        
        // 인증 성공 - 인증 상태를 Redis에 저장 (24시간 유지)
        redisTemplate.opsForValue().set(verifiedKey, "true", 24, TimeUnit.HOURS);
        
        // 사용된 인증 코드 삭제
        redisTemplate.delete(codeKey);
    }
    
    // 이메일 인증 상태 확인 (회원가입 시 사용)
    public boolean isEmailVerified(String email) {
        String verifiedKey = EMAIL_VERIFIED_PREFIX + email;
        return Boolean.TRUE.equals(redisTemplate.hasKey(verifiedKey));
    }

    private String generateCode() {
        return String.format("%06d", new Random().nextInt(999999));
    }
}
