package com.ssafy.dochi;

import com.ssafy.dochi.config.OpenViduConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(OpenViduConfig.class)
public class SsafyDochiBeApplication {

    public static void main(String[] args) {
        SpringApplication.run(SsafyDochiBeApplication.class, args);
    }

}
