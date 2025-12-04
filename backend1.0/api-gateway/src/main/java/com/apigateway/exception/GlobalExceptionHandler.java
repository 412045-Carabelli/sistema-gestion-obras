package com.apigateway.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorApi> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorApi.of(ex.getMessage(), HttpStatus.BAD_REQUEST.value()));
    }

    @ExceptionHandler(WebClientResponseException.class)
    public ResponseEntity<ErrorApi> handleWebClient(WebClientResponseException ex) {
        ErrorApi body = extractError(ex);
        return ResponseEntity.status(ex.getStatusCode())
                .body(body != null ? body : ErrorApi.of(ex.getMessage(), ex.getRawStatusCode()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorApi> handleGeneric(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorApi.of(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value()));
    }

    private ErrorApi extractError(WebClientResponseException ex) {
        try {
            return objectMapper.readValue(ex.getResponseBodyAsString(), ErrorApi.class);
        } catch (Exception ignored) {
            return null;
        }
    }
}
