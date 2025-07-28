package com.ssafy.dochi.common.security;


import com.ssafy.dochi.common.security.exception.ForbiddenException;
import com.ssafy.dochi.common.security.exception.UnAuthorizedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.util.Arrays;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtTokenProvider jwtTokenProvider;
    private final CustomDetailService customDetailService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    public class SecurityFilterManagerImpl extends AbstractHttpConfigurer<SecurityFilterManagerImpl, HttpSecurity> {
        public void configure(HttpSecurity builder) throws Exception {
            final AuthenticationManager authenticationManager = builder.getSharedObject(AuthenticationManager.class);
            builder.addFilter(new JwtAuthenticationFilter(authenticationManager, jwtTokenProvider, customDetailService));
            super.configure(builder);
        }
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   @Autowired @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver) throws Exception {
        // csrf disable
        http.csrf(AbstractHttpConfigurer::disable);

        // cors 재설정
        http.cors(corsCustomizer -> corsCustomizer.configurationSource(configurationSource()));

        // 세션 사용 안함 -> 토큰 방식 사용
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        // form 로그인 해제 (UsernamePasswordAuthenticationFilter 비활성화)
        http.formLogin(AbstractHttpConfigurer::disable);

        // username, password 헤더 로그인 방식 해제 (BasicAuthenticationFilter 비활성화)
        http.httpBasic(AbstractHttpConfigurer::disable);

        // 커스텀 필터 등록
        // http.apply(new SecurityFilterManagerImpl()); <- deprecated
        http.with(new SecurityFilterManagerImpl(), securityFilterManager -> {
        });

        // 인증 실패 처리
        http.exceptionHandling(handling -> handling.authenticationEntryPoint(((request, response, authException) -> {
            resolver.resolveException(request, response, null, new UnAuthorizedException("인증되지 않은 사용자입니다."));
        })));

        // 권한 실패 처리
        http.exceptionHandling(handling -> handling.accessDeniedHandler(((request, response, accessDeniedException) -> {
            resolver.resolveException(request, response, null, new ForbiddenException("권한이 없습니다."));
        })));

        // http.exceptionHandling(handler ->
        // handler.authenticationEntryPoint(entryPoint));

        http.authorizeHttpRequests(
                authorize -> authorize.requestMatchers(new AntPathRequestMatcher("/member/info", "GET")).authenticated()
                        .requestMatchers(new AntPathRequestMatcher("/member/info", "PUT")).authenticated()
                        .anyRequest().permitAll());

        return http.build();

    }

    public CorsConfigurationSource configurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*"); // GET, POST, PUT, DELETE (Javascript 요청 허용)
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173", "http://localhost:5174", "https://ssafy-home-fe.vercel.app/"));
        configuration.setAllowCredentials(true); // 클라이언트에서 쿠키 요청 허용
        configuration.addExposedHeader("Authorization");
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
