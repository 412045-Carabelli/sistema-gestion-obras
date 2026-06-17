package com.meliquina.common.dto;

import java.time.Instant;
import java.util.Map;

public class ErrorApi {
    private String message;
    private int status;
    private String path;
    private Instant timestamp;
    private Map<String, String> errors;

    public ErrorApi() {
    }

    public ErrorApi(String message, int status, String path, Instant timestamp) {
        this(message, status, path, timestamp, null);
    }

    public ErrorApi(String message, int status, String path, Instant timestamp, Map<String, String> errors) {
        this.message = message;
        this.status = status;
        this.path = path;
        this.timestamp = timestamp;
        this.errors = errors;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public Map<String, String> getErrors() {
        return errors;
    }

    public void setErrors(Map<String, String> errors) {
        this.errors = errors;
    }
}
