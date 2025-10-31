package com.jwt.service;

import com.jwt.dto.TokenRequest;
import com.jwt.dto.TokenResponse;

/**
 * Contract that defines JWT management operations.
 */
public interface TokenService {

    /**
     * Generates a new JWT token for the provided request.
     *
     * @param request payload with claims
     * @return token response
     */
    TokenResponse generate(TokenRequest request);
}
