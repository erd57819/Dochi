package com.ssafy.dochi.user.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PACKAGE)
public class User {

    private Long id;
    private String userId;
    private String name;
    private String nickname;
    private String email;
    private String password;
    private String address;
    private Integer age;
    private String gender;         // MALE / FEMALE /NONE
    private String role;           // USER / ADMIN
    private boolean isSocial;
    private String kakaoId;
    private String googleId;
    private boolean emailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String refreshToken;
    private String profileImage;


    // 생성자
    public User(Long id) {
        this.id = id;
    }

    public User(String email) {
        this.email = email;
    }
    public User(String name, String email, String password, boolean isSocial, String image){
        this.name = name;
        this.email = email;
        this.password = password;
        this.isSocial = isSocial;
        this.profileImage = image;
    }
    public User(String userId, String password) {
        this.userId = userId;
        this.password = password;
    }


    public User(String name, String userId, String password) {
        this.name = name;
        this.userId = userId;
        this.password = password;
        this.role = "USER";
    }

    public User(String userId, String name, String nickname, String email, String password, int age, String gender, String address, String profileImage, boolean isSocial) {
        this.userId = userId;
        this.name = name;
        this.nickname = nickname;
        this.email = email;
        this.password = password;
        this.age = age;
        this.gender = gender;
        this.role = "USER";
        this.isSocial = isSocial;
        this.emailVerified = true;
        this.address = address;
        this.profileImage = profileImage;
    }

    public User(String name, String userId, String password, boolean isSocial, String profileImage, String kakaoId, String googleId) {
        this.name = name;
        this.email = userId;
        this.password = password;
        this.isSocial = isSocial;
        this.profileImage = profileImage;
        this.kakaoId = kakaoId;
        this.googleId = googleId;
        this.role = "USER";
    }
}
