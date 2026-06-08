package com.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * Security Configuration para API Gateway.
 *
 * Autenticación stateless no implementada (sistema interno, red privada).
 * La autorización a nivel de operación se delega a @PreAuthorize en cada controller.
 * CSRF deshabilitado: API REST consumida por SPA Angular vía CORS restringido.
 *
 * TODO (cuando se implemente auth): reemplazar anyExchange().permitAll()
 *   por .pathMatchers("/bff/**").authenticated() y agregar JWT filter.
 */
@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain filterChain(ServerHttpSecurity http) {
        http
            .authorizeExchange()
                .pathMatchers("/api-docs/**", "/swagger-ui/**").permitAll()
                .anyExchange().permitAll()  // Sin auth stateless implementada — ver TODO arriba
            .and()
            .csrf().disable()  // REST API + CORS: CSRF no aplica
            .httpBasic().disable()
            .formLogin().disable();

        return http.build();
    }
}
