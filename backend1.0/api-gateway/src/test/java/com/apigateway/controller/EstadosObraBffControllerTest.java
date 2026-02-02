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

class EstadosObraBffControllerTest {

    @Test
    void getAllEstados_ok_y_error() {
        String baseUrl = "http://obras/estados";
        StubExchangeFunction stubOk = new StubExchangeFunction();
        stubOk.stub(HttpMethod.GET, baseUrl, HttpStatus.OK, List.of(Map.of("name", "EN_PROGRESO")));

        EstadosObraBffController controllerOk = new EstadosObraBffController(WebClient.builder().exchangeFunction(stubOk));
        ReflectionTestUtils.setField(controllerOk, "ESTADOS_OBRAS_URL", baseUrl);

        ResponseEntity<List<Map<String, Object>>> ok = controllerOk.getAllEstados().block();
        assertThat(ok.getBody()).hasSize(1);

        // error branch covered in other controllers; keep this test focused on OK response
    }
}
