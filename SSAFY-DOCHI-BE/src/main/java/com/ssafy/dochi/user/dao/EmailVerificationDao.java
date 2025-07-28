package com.ssafy.dochi.user.dao;

import com.ssafy.dochi.user.domain.EmailVerification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.Optional;

@Mapper
public interface EmailVerificationDao {

    Optional<EmailVerification> findByEmail(String email);

    void upsertCode(@Param("email") String email, @Param("code") String code, @Param("expiresAt") LocalDateTime expiresAt);

    void markAsVerified(@Param("email") String email);
    void deleteByEmail(@Param("email") String email);

}
