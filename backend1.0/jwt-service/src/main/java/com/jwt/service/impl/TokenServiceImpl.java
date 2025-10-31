package com.jwt.service.impl;

import com.jwt.dto.TokenRequest;
import com.jwt.dto.TokenResponse;
import com.jwt.service.TokenService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Default implementation that generates signed JWT tokens using a shared secret.
 */
@Service
public class TokenServiceImpl implements TokenService {

    private final SecretKey secretKey;
    private final long expirationMinutes;

    /**
     * Creates the service resolving the secret key from configuration.
     *
     * @param secret             secret phrase used to sign the token
     * @param expirationMinutes  minutes until expiration
     */
    public TokenServiceImpl(@Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.expiration-minutes:60}") long expirationMinutes) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
    }

    @Override
    public TokenResponse generate(TokenRequest request) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(expirationMinutes, ChronoUnit.MINUTES);
        List<String> roles = Objects.requireNonNullElse(request.roles(), List.of());
        String token = Jwts.builder()
                .subject(request.subject())
                .claim("roles", roles)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(secretKey)
                .compact();
        return new TokenResponse(token, expiresAt);
    }
}
