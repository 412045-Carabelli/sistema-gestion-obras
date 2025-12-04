package com.apigateway.exception;

import java.time.Instant;

public class ErrorApi {
    private final Instant timestamp;
    private final String message;
    private final int status;

    public ErrorApi(Instant timestamp, String message, int status) {
        this.timestamp = timestamp;
        this.message = message;
        this.status = status;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public String getMessage() {
        return message;
    }

    public int getStatus() {
        return status;
    }

    public static ErrorApi of(String message, int status) {
        return new ErrorApi(Instant.now(), message, status);
    }
}
