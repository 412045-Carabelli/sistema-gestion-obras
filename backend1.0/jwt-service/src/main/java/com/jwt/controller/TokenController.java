package com.jwt.controller;

import com.jwt.dto.TokenRequest;
import com.jwt.dto.TokenResponse;
import com.jwt.service.TokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller exposing JWT generation endpoints.
 */
@RestController
@RequestMapping("/api/v1/tokens")
@RequiredArgsConstructor
@Validated
@Tag(name = "Tokens", description = "Emisión y utilidades para JWT")
public class TokenController {

    private final TokenService tokenService;

    /**
     * Generates a signed JWT token.
     *
     * @param request payload with subject and roles
     * @return token response
     */
    @PostMapping
    @Operation(summary = "Generar token JWT")
    public ResponseEntity<TokenResponse> generate(@Valid @RequestBody TokenRequest request) {
        return ResponseEntity.ok(tokenService.generate(request));
    }
}
