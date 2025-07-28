package com.ssafy.dochi.user.dao;

import com.ssafy.dochi.user.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Optional;
import java.util.List;

@Mapper
public interface UserDao {

    void save(User user);

    Optional<User> findById(@Param("id") Long id);

    Optional<User> findByUserId(@Param("userId") String userId);

    Optional<User> findByEmail(@Param("email") String email);

    Optional<User> findByNickname(@Param("nickname") String nickname);

    Optional<User> userInfo(@Param("id") Long id);

    void update(@Param("id") Long id,
                @Param("name") String name,
                @Param("nickname") String nickname,
                @Param("address") String address);

    void updatePassword(@Param("id") Long id,
                        @Param("password") String password);

    void updateProfileImage(@Param("id") Long id,
                            @Param("profileImage") String profileImage);

    void updateRefreshToken(@Param("id") Long id,
                            @Param("refreshToken") String refreshToken);

    void deleteById(@Param("id") Long id);

    void deleteByKakaoId(@Param("kakaoId") String kakaoId);

    void deleteByGoogleId(@Param("googleId") String googleId);

    void updateIsActive(User user);

}
