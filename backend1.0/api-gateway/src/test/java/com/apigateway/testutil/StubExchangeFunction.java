package com.apigateway.testutil;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

public class StubExchangeFunction implements ExchangeFunction {

    private final Map<String, ClientResponse> responses = new HashMap<>();

    public void stub(HttpMethod method, String url, HttpStatus status, Object body) {
        ClientResponse.Builder builder = ClientResponse.create(status);
        if (body != null) {
            String payload = body instanceof String ? (String) body : toJson(body);
            builder.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .body(payload);
        }
        responses.put(key(method, url), builder.build());
    }

    @Override
    public Mono<ClientResponse> exchange(ClientRequest request) {
        String key = key(request.method(), request.url().toString());
        ClientResponse response = responses.get(key);
        if (response != null) {
            return Mono.just(response);
        }
        return Mono.error(new RuntimeException("No stub for " + key));
    }

    private static String key(HttpMethod method, String url) {
        return method.name() + " " + url;
    }

    private static String toJson(Object body) {
        try {
            return new ObjectMapper().writeValueAsString(body);
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }
}
