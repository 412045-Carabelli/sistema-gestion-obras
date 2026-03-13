package com.clientes.handler;

import com.clientes.exception.ClienteNotFoundException;
import com.clientes.exception.InvalidClienteException;
import com.meliquina.common.dto.ErrorApi;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import java.time.Instant;

@ControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(ClienteNotFoundException.class)
    public ResponseEntity<ErrorApi> handleNotFound(ClienteNotFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(buildError(ex.getMessage(), HttpStatus.NOT_FOUND, request, null));
    }

    @ExceptionHandler(InvalidClienteException.class)
    public ResponseEntity<ErrorApi> handleInvalid(InvalidClienteException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildError(ex.getMessage(), HttpStatus.BAD_REQUEST, request, null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorApi> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildError("Validation error", HttpStatus.BAD_REQUEST, request, errors));
    }

    private ErrorApi buildError(String message, HttpStatus status, HttpServletRequest request, Map<String, String> errors) {
        String path = request != null ? request.getRequestURI() : "";
        return new ErrorApi(
                message != null ? message : status.getReasonPhrase(),
                status.value(),
                path,
                Instant.now(),
                errors
        );
    }
}
