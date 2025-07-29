package com.ssafy.dochi.common.security;

import com.ssafy.dochi.user.domain.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

// 임시 Mock 클래스 - 유저 모듈 완성되면 교체 예정
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails {
    private final User user;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> roles = new ArrayList<>();
        if (user.getRole() != null) {
            roles.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().toString()));
        }
        return roles;
    }

    public Long getId() {
        return user.getId();
    }

    public String getName() {
        // TODO Auto-generated method stub
        return user.getName();
    }

    public String getEmail() {
        return user.getEmail();
    }

    @Override
    public String getPassword() {
        // TODO Auto-generated method stub
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        // TODO Auto-generated method stub
        return null;
    }





}