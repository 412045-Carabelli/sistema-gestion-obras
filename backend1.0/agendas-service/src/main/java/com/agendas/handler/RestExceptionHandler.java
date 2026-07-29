package com.agendas.handler;

import com.common.plan.FeatureNotAvailableException;
import com.common.plan.PlanLimitExceededException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RestExceptionHandler {

    @ExceptionHandler(PlanLimitExceededException.class)
    public ResponseEntity<Map<String, Object>> handlePlanLimit(PlanLimitExceededException ex, HttpServletRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("code", "PLAN_LIMIT_EXCEEDED");
        body.put("message", ex.getMessage());
        body.put("recurso", ex.getRecurso());
        body.put("limiteActual", ex.getLimiteActual());
        body.put("cantidadActual", ex.getCantidadActual());
        body.put("path", request.getRequestURI());
        body.put("timestamp", Instant.now());
        return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(body);
    }

    @ExceptionHandler(FeatureNotAvailableException.class)
    public ResponseEntity<Map<String, Object>> handleFeatureNotAvailable(FeatureNotAvailableException ex, HttpServletRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("code", "FEATURE_NOT_AVAILABLE");
        body.put("message", ex.getMessage());
        body.put("feature", ex.getFeature());
        body.put("path", request.getRequestURI());
        body.put("timestamp", Instant.now());
        return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(body);
    }
}
