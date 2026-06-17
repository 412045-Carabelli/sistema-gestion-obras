package com.apigateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Data;

@Configuration
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtProperties {
  private String secret = "your-super-secret-key-min-32-chars-long-for-hs256-algorithm";
}
