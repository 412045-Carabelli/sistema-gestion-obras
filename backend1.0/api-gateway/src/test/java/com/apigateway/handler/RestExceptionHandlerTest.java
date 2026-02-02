package com.apigateway.handler;

import com.apigateway.dto.ErrorApi;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class RestExceptionHandlerTest {

    @Test
    void handleWebClient_usaMensajeRemoto() {
        String body = "{\"message\":\"remote error\"}";
        WebClientResponseException ex = WebClientResponseException.create(
                404,
                "Not Found",
                HttpHeaders.EMPTY,
                body.getBytes(StandardCharsets.UTF_8),
                StandardCharsets.UTF_8
        );

        RestExceptionHandler handler = new RestExceptionHandler(new ObjectMapper());
        ResponseEntity<ErrorApi> response = handler.handleWebClient(ex, MockServerHttpRequest.get("/path").build());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().getMessage()).isEqualTo("remote error");
        assertThat(response.getBody().getPath()).isEqualTo("/path");
    }

    @Test
    void handleWebClient_caeEnStatusText() {
        WebClientResponseException ex = WebClientResponseException.create(
                500,
                "Server Error",
                HttpHeaders.EMPTY,
                "".getBytes(StandardCharsets.UTF_8),
                StandardCharsets.UTF_8
        );

        RestExceptionHandler handler = new RestExceptionHandler(new ObjectMapper());
        ResponseEntity<ErrorApi> response = handler.handleWebClient(ex, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getMessage()).isEqualTo("Server Error");
    }

    @Test
    void handleIllegalArgument_y_generica() {
        RestExceptionHandler handler = new RestExceptionHandler(new ObjectMapper());

        ResponseEntity<ErrorApi> bad = handler.handleIllegalArgument(new IllegalArgumentException("bad"),
                MockServerHttpRequest.get("/bad").build());
        ResponseEntity<ErrorApi> generic = handler.handleGeneric(new RuntimeException("boom"),
                MockServerHttpRequest.get("/err").build());

        assertThat(bad.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(bad.getBody().getMessage()).isEqualTo("bad");
        assertThat(generic.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(generic.getBody().getMessage()).isEqualTo("boom");
    }
}
