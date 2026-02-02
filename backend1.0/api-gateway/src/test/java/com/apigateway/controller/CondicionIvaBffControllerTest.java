package com.apigateway.controller;

import com.apigateway.testutil.StubExchangeFunction;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class CondicionIvaBffControllerTest {

    @Test
    void getCondiciones_ok() {
        StubExchangeFunction stub = new StubExchangeFunction();
        String baseUrl = "http://clientes";
        stub.stub(HttpMethod.GET, baseUrl + "/condicion-iva", HttpStatus.OK, List.of(Map.of("id", 1)));

        CondicionIvaBffController controller = new CondicionIvaBffController(WebClient.builder().exchangeFunction(stub));
        ReflectionTestUtils.setField(controller, "CLIENTES_URL", baseUrl);

        ResponseEntity<List<Map<String, Object>>> response = controller.getCondicionesIva().block();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
    }
}
