package com.ssafy.dochi.user.service;


import com.ssafy.dochi.chat.dao.ChatDao;
import com.ssafy.dochi.chat.domain.ChatRoom;
import com.ssafy.dochi.common.security.CustomUserDetails;
import com.ssafy.dochi.common.security.JwtTokenProvider;
import com.ssafy.dochi.user.dao.EmailVerificationDao;
import com.ssafy.dochi.user.dao.UserDao;
import com.ssafy.dochi.user.domain.EmailVerification;
import com.ssafy.dochi.user.domain.User;
import com.ssafy.dochi.user.service.EmailVerificationService;
import com.ssafy.dochi.user.dto.request.UserLoginReqDto;
import com.ssafy.dochi.user.dto.request.UserPasswordUpdateReqDto;
import com.ssafy.dochi.user.dto.request.UserSignUpReqDto;
import com.ssafy.dochi.user.dto.request.UserUpdateReqDto;
import com.ssafy.dochi.user.dto.response.UserInfoResDto;
import com.ssafy.dochi.user.dto.response.UserLoginResDto;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserDao userDao;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailVerificationDao emailVerificationDao;
    private final EmailVerificationService emailVerificationService;
    private final ChatDao chatDao;

    public UserLoginResDto login(UserLoginReqDto reqDto) {

        // 요청 DTO에 온 아이디로 멤버가 존재하는지 확인
        User user = userDao.findByUserId(reqDto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("회원가입이 필요합니다."));

        // 비밀번호가 맞지 않다면 400 에러 반환
        if (!passwordEncoder.matches(reqDto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 잘못됐습니다.");
        }

        // 액세스 토큰 발급 및 반환
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getRole());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());
        userDao.updateRefreshToken(user.getId(), refreshToken);
        String image = user.getProfileImage();
        String name = user.getName();
        String nickname = user.getNickname();
        boolean isSocial = false;
        String email = user.getEmail();
        String userId = user.getUserId();
        if(user.getRole().equals("ADMIN")) {
            return new UserLoginResDto(accessToken, refreshToken, image, name, nickname, userId, email, "admin", isSocial);
        }
        return new UserLoginResDto(accessToken, refreshToken, image, name, nickname, userId, email, "user", isSocial);

    }
    @Transactional
    public String reissue(String accessToken, String refreshToken) {
        // AccessToken에서 사용자 정보 추출
        Long userId = jwtTokenProvider.getMemberIdFromExpiredToken(accessToken); // 만료된 토큰에서 claim 추출
        User user = userDao.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다."));

        // DB에 저장된 리프레시 토큰과 일치하는지 확인
        if (!refreshToken.equals(user.getRefreshToken())) {
            throw new JwtException("리프레시 토큰이 유효하지 않습니다.");
        }

        // RefreshToken도 만료되었는지 확인
        if (jwtTokenProvider.isTokenExpired(refreshToken)) {
            throw new JwtException("리프레시 토큰이 만료되었습니다. 재로그인이 필요합니다.");
        }

        // 새로운 AccessToken 생성
        String newAccessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getRole());
        return newAccessToken;
    }

    public void regist(UserSignUpReqDto reqDto) {

        // 회원가입이 이미 된 이메일이 존재하는지 확인
        userDao.findByEmail(reqDto.getEmail()).ifPresent(member -> {
            throw new IllegalArgumentException("이미 회원가입이 된 회원입니다.");
        });

        // 회원가입이 이미 된 아이디가 존재하는지 확인
        userDao.findByUserId(reqDto.getUserId()).ifPresent(member -> {
            throw new IllegalArgumentException("이미 사용중인 아이디입니다.");
        });

        // Redis 기반 이메일 인증 확인
        if (!emailVerificationService.isEmailVerified(reqDto.getEmail())) {
            throw new IllegalArgumentException("이메일 인증이 완료되지 않았습니다.");
        }

        //닉네임 중복 확인
        userDao.findByNickname(reqDto.getNickname()).ifPresent(member -> {
            throw new IllegalArgumentException("이미 사용중인 닉네임입니다.");
        });
        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(reqDto.getPassword());

        // DB에 멤버 저장
        User user = new User(reqDto.getUserId(),reqDto.getName(), reqDto.getNickname(), reqDto.getEmail(), encodedPassword, reqDto.getAge(), reqDto.getGender(), reqDto.getAddress(), reqDto.getProfileImage(),false);
        userDao.save(user);

    }

    public UserInfoResDto userInfo(CustomUserDetails user) {

        User logedInUser = userDao.findByEmail(user.getEmail()).orElseThrow(
                () -> new IllegalArgumentException("존재하지 않는 회원입니다.")
        );
        System.out.println(logedInUser.getRole());
        boolean isSocial = logedInUser.isSocial();
        return new UserInfoResDto(logedInUser.getUserId(), logedInUser.getName(), logedInUser.getNickname(),logedInUser.getProfileImage(), logedInUser.getEmail(),logedInUser.getAddress(),logedInUser.getAge(), logedInUser.getGender(), logedInUser.getCreatedAt());

    }

    public void updateUserInfo(CustomUserDetails user, UserUpdateReqDto reqDto) {
        // 닉네임이 변경된 경우에만 중복 검사
        User currentUser = userDao.findById(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        if (!currentUser.getNickname().equals(reqDto.getNickname())) {
            userDao.findByNickname(reqDto.getNickname()).ifPresent(member -> {
                throw new IllegalArgumentException("이미 사용중인 닉네임입니다.");
            });
        }

        userDao.update(user.getId(), user.getName(), reqDto.getNickname(), reqDto.getAddress());
    }

    public void deleteUser(CustomUserDetails user) {
        Long userId = user.getId();
        userDao.deleteById(userId);
        emailVerificationDao.deleteByEmail(user.getEmail());
    }
    public void updatePassword(CustomUserDetails member, UserPasswordUpdateReqDto dto) {
        User loginedMember = userDao.findById(member.getId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        if (!passwordEncoder.matches(dto.getCurrentPassword(), loginedMember.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        String encodedNewPassword = passwordEncoder.encode(dto.getNewPassword());
        userDao.updatePassword(loginedMember.getId(), encodedNewPassword);
    }
    @Transactional
    public void updateProfileImage(Long id, String imageUrl) {
        userDao.updateProfileImage(id, imageUrl);
    }
    @Transactional
    public void updateRefreshToken(Long memberId, String refreshToken) {
        userDao.updateRefreshToken(memberId, refreshToken); // 또는 Redis 저장
    }
}
