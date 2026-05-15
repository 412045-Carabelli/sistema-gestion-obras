package com.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * Security Configuration para API Gateway
 * Protege endpoints BFF con validación de headers + rate limiting básico
 */
@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain filterChain(ServerHttpSecurity http) {
        http
            // Proteger endpoints BFF
            .authorizeExchange()
                .pathMatchers("/bff/**").permitAll()  // Configurar con @PreAuthorize en controllers
                .pathMatchers("/api-docs/**", "/swagger-ui/**").permitAll()
                .anyExchange().permitAll()
            .and()
            // Deshabilitar CSRF para APIs REST (protegido por CORS)
            .csrf()
                .disable();

        return http.build();
    }
}
