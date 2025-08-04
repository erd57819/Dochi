package com.ssafy.dochi.common.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;

import java.io.IOException;

@Slf4j
public class JwtAuthenticationFilter extends BasicAuthenticationFilter {
    private static final String HEADER = "Authorization";
    private final JwtTokenProvider jwtTokenProvider;
    private final CustomDetailService customDetailService;

    public JwtAuthenticationFilter(AuthenticationManager authenticationManager, JwtTokenProvider jwtTokenProvider,
                                   CustomDetailService customDetailService) {
        super(authenticationManager);
        this.jwtTokenProvider = jwtTokenProvider;
        this.customDetailService = customDetailService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        // 리프레시 토큰 재발급 경로는 필터 통과
        if (path.equals("/member/reissue")) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = request.getHeader(HEADER);
        // 헤더에서 JWT를 받아오고 토큰이 없으면 다음 필터로 넘어감.
        if (path.startsWith("/member/login") ||
                path.startsWith("/member/regist") ||
                path.startsWith("/member/reissue") ||
                path.startsWith("/oauth")) {
            filterChain.doFilter(request, response);
            return;
        }
        // JWT 없는 요청은 인증 처리 안 함
        if (jwt == null) {
            filterChain.doFilter(request, response);
            return;
        }
        // 헤더에 JWT가 존재한다면 Claims 추출하여 사용자 정보를 이용해 UserDetails 객체를 만들고 이를 이용해
        // Authentication 객체를 만들어 SecurityContext에 저장
        try {
            Long memberId = jwtTokenProvider.getMemberIdFromToken(jwt);
            UserDetails userDetails = customDetailService.loadUserByUsername(String.valueOf(memberId));

            UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(token);

            // 다음 필터로 넘어감
            filterChain.doFilter(request, response);
        } catch (SecurityException e) {
            throw new JwtException("잘못된 JWT 시그니처");
        } catch (MalformedJwtException e) {
            throw new JwtException("유효하지 않은 JWT 토큰");
        } catch (ExpiredJwtException e) {
            throw new JwtException("토큰 기한 만료");
        } catch (UnsupportedJwtException e) {
            throw new JwtException("지원하지 않는 JWT 토큰");
        } catch (IllegalArgumentException e) {
            throw new JwtException("JWT token compact of handler are invalid.");
        }

    }

}