package com.apigateway.handler;

import com.apigateway.dto.ErrorApi;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Instant;

@RestControllerAdvice
@RequiredArgsConstructor
public class RestExceptionHandler {

    private final ObjectMapper objectMapper;

    @ExceptionHandler(WebClientResponseException.class)
    public ResponseEntity<ErrorApi> handleWebClient(WebClientResponseException ex, ServerHttpRequest request) {
        String path = request != null ? request.getPath().value() : "";
        ErrorApi error = parseRemoteError(ex, path);
        return ResponseEntity.status(ex.getStatusCode()).body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorApi> handleIllegalArgument(IllegalArgumentException ex, ServerHttpRequest request) {
        return buildError(ex.getMessage(), HttpStatus.BAD_REQUEST, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorApi> handleGeneric(Exception ex, ServerHttpRequest request) {
        return buildError(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, request);
    }

    private ResponseEntity<ErrorApi> buildError(String message, HttpStatus status, ServerHttpRequest request) {
        String path = request != null ? request.getPath().value() : "";
        ErrorApi body = new ErrorApi(
                message != null ? message : status.getReasonPhrase(),
                status.value(),
                path,
                Instant.now()
        );
        return ResponseEntity.status(status).body(body);
    }

    private ErrorApi parseRemoteError(WebClientResponseException ex, String path) {
        String body = ex.getResponseBodyAsString();
        String message = null;

        if (body != null && !body.isBlank()) {
            try {
                JsonNode node = objectMapper.readTree(body);
                if (node.hasNonNull("message")) {
                    message = node.get("message").asText();
                } else if (node.hasNonNull("error")) {
                    message = node.get("error").asText();
                } else if (node.hasNonNull("detail")) {
                    message = node.get("detail").asText();
                }
            } catch (Exception ignored) {
                message = body;
            }
        }

        if (message == null || message.isBlank()) {
            message = ex.getStatusText();
        }

        return new ErrorApi(
                message,
                ex.getRawStatusCode(),
                path,
                Instant.now()
        );
    }
}
