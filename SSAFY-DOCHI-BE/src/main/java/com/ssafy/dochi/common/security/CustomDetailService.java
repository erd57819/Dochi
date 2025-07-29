package com.ssafy.dochi.common.security;

import com.ssafy.dochi.user.dao.UserDao;
import com.ssafy.dochi.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CustomDetailService implements UserDetailsService {
    private final UserDao userDao;

    @Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        User user = userDao.findById(Long.parseLong(userId))
                .orElseThrow(() -> new UsernameNotFoundException("존재하지 않는 회원입니다."));
        System.out.println(user.getEmail());
        return new CustomUserDetails(user);
    }
}
