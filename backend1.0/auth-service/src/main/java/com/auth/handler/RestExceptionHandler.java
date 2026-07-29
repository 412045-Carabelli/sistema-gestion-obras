package com.auth.handler;

import com.auth.dto.ErrorApi;
import com.auth.exception.AccountLockedException;
import com.auth.exception.AuthException;
import com.auth.exception.ResourceNotFoundException;
import com.auth.exception.UserAlreadyExistsException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class RestExceptionHandler {

  @ExceptionHandler(UserAlreadyExistsException.class)
  public ResponseEntity<ErrorApi> handleUserAlreadyExists(
      UserAlreadyExistsException ex,
      HttpServletRequest request) {
    ErrorApi error = new ErrorApi();
    error.setMessage(ex.getMessage());
    error.setStatus(409);
    error.setPath(request.getRequestURI());
    error.setTimestamp(Instant.now());
    return ResponseEntity.status(409).body(error);
  }

  @ExceptionHandler(AccountLockedException.class)
  public ResponseEntity<ErrorApi> handleAccountLocked(
      AccountLockedException ex,
      HttpServletRequest request) {
    ErrorApi error = new ErrorApi();
    error.setMessage(ex.getMessage());
    error.setStatus(423);  // Locked
    error.setPath(request.getRequestURI());
    error.setTimestamp(Instant.now());
    return ResponseEntity.status(423).body(error);
  }

  @ExceptionHandler(AuthException.class)
  public ResponseEntity<ErrorApi> handleAuthException(
      AuthException ex,
      HttpServletRequest request) {
    ErrorApi error = new ErrorApi();
    error.setMessage(ex.getMessage());
    error.setStatus(401);
    error.setPath(request.getRequestURI());
    error.setTimestamp(Instant.now());
    return ResponseEntity.status(401).body(error);
  }

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ErrorApi> handleNotFound(
      ResourceNotFoundException ex,
      HttpServletRequest request) {
    ErrorApi error = new ErrorApi();
    error.setMessage(ex.getMessage());
    error.setStatus(404);
    error.setPath(request.getRequestURI());
    error.setTimestamp(Instant.now());
    return ResponseEntity.status(404).body(error);
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ErrorApi> handleIllegalArgument(
      IllegalArgumentException ex,
      HttpServletRequest request) {
    ErrorApi error = new ErrorApi();
    error.setMessage(ex.getMessage());
    error.setStatus(400);
    error.setPath(request.getRequestURI());
    error.setTimestamp(Instant.now());
    return ResponseEntity.status(400).body(error);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> handleValidation(
      MethodArgumentNotValidException ex) {
    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult().getFieldErrors().forEach(err ->
        errors.put(err.getField(), err.getDefaultMessage())
    );
    return ResponseEntity.badRequest().body(errors);
  }

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<ErrorApi> handleGeneric(
      RuntimeException ex,
      HttpServletRequest request) {
    log.error("Error interno sin manejo", ex);
    ErrorApi error = new ErrorApi();
    error.setMessage("Error interno del servidor");
    error.setStatus(500);
    error.setPath(request.getRequestURI());
    error.setTimestamp(Instant.now());
    return ResponseEntity.status(500).body(error);
  }
}
