package com.apigateway.handler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ServerWebExchange;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Manejo centralizado de excepciones para API Gateway
 * - Loguea detalles internamente
 * - Retorna respuestas genéricas al cliente (sin stack traces)
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Validación de request binding (parámetros inválidos)
     */
    @ExceptionHandler(WebExchangeBindException.class)
    public ResponseEntity<Map<String, Object>> handleBindException(
            WebExchangeBindException ex,
            ServerWebExchange exchange) {

        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });

        log.warn("Validación fallida en {}: {}", exchange.getRequest().getPath(), fieldErrors);

        Map<String, Object> response = new HashMap<>();
        response.put("error", "Validación de parámetros fallida");
        response.put("campos", fieldErrors);
        response.put("timestamp", Instant.now());

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Manejo genérico de excepciones (No Encontrado, Servidor, etc.)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception ex,
            ServerWebExchange exchange) {

        log.error("Error no manejado en {}: {}", exchange.getRequest().getPath(), ex.getMessage(), ex);

        Map<String, Object> response = new HashMap<>();
        response.put("error", "Error interno del servidor");
        response.put("timestamp", Instant.now());
        response.put("path", exchange.getRequest().getPath().value());

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }
}
