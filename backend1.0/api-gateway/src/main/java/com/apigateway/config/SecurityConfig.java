package com.apigateway.config;

import com.apigateway.filter.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.context.NoOpServerSecurityContextRepository;

/**
 * Security Configuration para API Gateway con JWT.
 *
 * Rutas públicas:
 * - /auth/** (registro, login, refresh, logout)
 * - /api-docs/**, /swagger-ui/** (documentación)
 *
 * Rutas protegidas:
 * - /bff/** (requieren JWT válido)
 *
 * El JWT token es validado e interpretado por JwtAuthenticationFilter.
 * Los claims (userId, username, rol) se propagan como headers (X-User-Id, X-User-Name, X-User-Rol)
 * hacia los servicios downstream, que confían en el gateway para la validación.
 */
@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain filterChain(ServerHttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter) {
        http
            .securityContextRepository(NoOpServerSecurityContextRepository.getInstance())
            .authorizeExchange()
                .pathMatchers("/auth/**").permitAll()  // Rutas de autenticación públicas
                .pathMatchers("/api-docs/**", "/swagger-ui/**").permitAll()  // Documentación
                .pathMatchers("/bff/**").authenticated()  // Rutas protegidas
                .anyExchange().permitAll()
            .and()
            .addFilterBefore(jwtAuthenticationFilter, org.springframework.security.web.server.WebFilter.class)
            .csrf().disable()  // REST API + CORS: CSRF no aplica
            .httpBasic().disable()
            .formLogin().disable();

        return http.build();
    }
}
