package com.ssafy.dochi.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "openvidu")
@Getter
@Setter
public class OpenViduConfig {
    private String url;
    private String secret;
}
