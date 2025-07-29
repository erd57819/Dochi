package com.ssafy.dochi.user.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.dochi.common.security.JwtTokenProvider;
import com.ssafy.dochi.user.dao.UserDao;
import com.ssafy.dochi.user.domain.User;
import com.ssafy.dochi.user.dto.KakaoUser;
import com.ssafy.dochi.user.dto.response.UserLoginResDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class KakaoOAuthService {
    private final UserDao userDao;
    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final PasswordEncoder passwordEncoder;
    @Value("${social.default.password}")
    private String socialDefaultPassword;

    @Value("${kakao.rest.api.key}")
    private String restApiKey;

    @Value("${kakao.redirect-uri}")
    private String redirectUri;

    @Value("${kakao.redirect-withdraw-uri}")
    private String withdrawUri;

    public UserLoginResDto processKakaoLogin(String code) {
        String kakaoAccessToken = getAccessToken(code);
        KakaoUser kakaoUser = getUserInfo(kakaoAccessToken);

        Optional<User> optionalMember = userDao.findByEmail(kakaoUser.getEmail());
        User user;
        boolean isNewUser = false;

        if (optionalMember.isEmpty()) {
            String encodedPassword = passwordEncoder.encode(socialDefaultPassword);
            user = new User(kakaoUser.getName(), kakaoUser.getEmail(), encodedPassword, true, kakaoUser.getProfileImageUrl());
            userDao.save(user);
            isNewUser = true;
        } else {
            user = optionalMember.get();
        }

        String jwtAccessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getRole());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());
        userDao.updateRefreshToken(user.getId(), refreshToken);
        String image = user.getProfileImage();
        String name = user.getName();
        String nickname = user.getNickname();
        boolean isSocial = true;
        String email = user.getEmail();
        if(user.getRole().equals("ADMIN")) {
            return new UserLoginResDto(jwtAccessToken, refreshToken, image,  name, nickname, user.getKakaoId(), email, "admin",isSocial);
        }
        return new UserLoginResDto(jwtAccessToken, refreshToken, image,  name, nickname, user.getKakaoId(), email, "user",isSocial);

    }

    private String getAccessToken(String code) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", restApiKey);
        params.add("redirect_uri", redirectUri);
        params.add("code", code);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(
                "https://kauth.kakao.com/oauth/token",
                request,
                String.class
        );

        try {
            JsonNode node = objectMapper.readTree(response.getBody());
            return node.get("access_token").asText();
        } catch (Exception e) {
            throw new RuntimeException("카카오 토큰 파싱 실패", e);
        }
    }
    private String getAccessToken(String code, String redirectUri) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", restApiKey);
        params.add("redirect_uri", redirectUri);
        params.add("code", code);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(
                "https://kauth.kakao.com/oauth/token",
                request,
                String.class
        );

        try {
            JsonNode node = objectMapper.readTree(response.getBody());
            return node.get("access_token").asText();
        } catch (Exception e) {
            throw new RuntimeException("카카오 토큰 파싱 실패", e);
        }
    }


    private KakaoUser getUserInfo(String accessToken) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(
                "https://kapi.kakao.com/v2/user/me",
                HttpMethod.GET,
                request,
                String.class
        );

        try {
            JsonNode node = objectMapper.readTree(response.getBody());
            Long id = node.get("id").asLong();
            String email = node.path("kakao_account").path("email").asText();
            String name = node.path("kakao_account").path("profile").path("nickname").asText();
            String profileImageUrl = node.path("kakao_account").path("profile").path("profile_image_url").asText();
            return new KakaoUser(id, email,name, profileImageUrl);
        } catch (Exception e) {
            throw new RuntimeException("카카오 사용자 정보 파싱 실패", e);
        }
    }

    @Transactional
    public void withdrawByKakaoCode(String code) {
        try {
            // 1. access token 요청
            String accessToken = getAccessToken(code, withdrawUri);
            // 2. 사용자 정보 요청 → 함수 재활용
            KakaoUser kakaoUser = getUserInfo(accessToken);
            String kakaoId = String.valueOf(kakaoUser.getId()); // id는 Long 타입이므로 문자열로 변환

            // 3. 카카오 연결 끊기 요청
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders unlinkHeaders = new HttpHeaders();
            unlinkHeaders.setBearerAuth(accessToken);
            HttpEntity<Void> unlinkRequest = new HttpEntity<>(unlinkHeaders);

            restTemplate.exchange(
                    "https://kapi.kakao.com/v1/user/unlink",
                    HttpMethod.POST,
                    unlinkRequest,
                    String.class
            );

            // 4. 우리 DB에서 삭제
            userDao.deleteByKakaoId(kakaoId);

        } catch (Exception e) {
            throw new RuntimeException("카카오 회원 탈퇴 처리 중 오류가 발생했습니다.", e);
        }
    }


}
