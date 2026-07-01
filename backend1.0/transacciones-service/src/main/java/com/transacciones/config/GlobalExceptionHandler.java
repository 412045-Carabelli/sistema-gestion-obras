package com.transacciones.config;

import com.common.plan.FeatureNotAvailableException;
import com.common.plan.PlanLimitExceededException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PlanLimitExceededException.class)
    public ResponseEntity<Map<String, Object>> handlePlanLimit(PlanLimitExceededException ex, HttpServletRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("code", "PLAN_LIMIT_EXCEEDED");
        body.put("message", ex.getMessage());
        body.put("recurso", ex.getRecurso());
        body.put("limiteActual", ex.getLimiteActual());
        body.put("cantidadActual", ex.getCantidadActual());
        body.put("path", request.getRequestURI());
        body.put("timestamp", Instant.now().toString());
        return ResponseEntity.status(402).body(body);
    }

    @ExceptionHandler(FeatureNotAvailableException.class)
    public ResponseEntity<Map<String, Object>> handleFeature(FeatureNotAvailableException ex, HttpServletRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("code", "FEATURE_NOT_AVAILABLE");
        body.put("message", ex.getMessage());
        body.put("feature", ex.getFeature());
        body.put("path", request.getRequestURI());
        body.put("timestamp", Instant.now().toString());
        return ResponseEntity.status(402).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(IllegalStateException ex) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
