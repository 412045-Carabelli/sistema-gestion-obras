package com.transacciones.config;

import com.meliquina.common.dto.ErrorApi;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorApi> handleBadRequest(IllegalArgumentException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorApi> handleConflict(IllegalStateException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    private ResponseEntity<ErrorApi> buildResponse(HttpStatus status, String message, HttpServletRequest request) {
        String path = request != null ? request.getRequestURI() : "";
        ErrorApi body = new ErrorApi(
                message != null ? message : status.getReasonPhrase(),
                status.value(),
                path,
                Instant.now()
        );
        return ResponseEntity.status(status).body(body);
    }
}
