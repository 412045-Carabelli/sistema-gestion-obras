package com.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Data;

@Configuration
@EnableConfigurationProperties(JwtConfig.class)
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtConfig {
  private String secret;
  private Long accessTokenExpiration = 900;  // 15 minutos en segundos
  private Long refreshTokenExpiration = 604800;  // 7 días en segundos
}
