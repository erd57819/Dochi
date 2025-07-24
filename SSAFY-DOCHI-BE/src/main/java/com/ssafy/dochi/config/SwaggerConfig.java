package com.ssafy.dochi.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("참견도치 API")
                        .description("갈등 해결 플랫폼 API 문서")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("SSAFY DOCHI Team")
                                .email("dochi@ssafy.com")
                                .url("https://github.com/ssafy/dochi")));
    }
}