package com.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Data;

@Configuration
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtConfig {
  private String secret;
  private Long accessTokenExpiration = 900L;  // 15 minutos en segundos
  private Long refreshTokenExpiration = 2592000L;  // 30 días en segundos
}
