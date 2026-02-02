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

class EstadoPagoBffControllerTest {

    @Test
    void getEstados_ok_y_error() {
        StubExchangeFunction stubOk = new StubExchangeFunction();
        String baseUrl = "http://obras/estado-pago";
        stubOk.stub(HttpMethod.GET, baseUrl, HttpStatus.OK, List.of(Map.of("id", 1)));

        EstadoPagoBffController controllerOk = new EstadoPagoBffController(WebClient.builder().exchangeFunction(stubOk));
        ReflectionTestUtils.setField(controllerOk, "ESTADO_PAGO_URL", baseUrl);

        ResponseEntity<List<Map<String, Object>>> ok = controllerOk.getEstadosPago().block();
        assertThat(ok.getBody()).hasSize(1);

        StubExchangeFunction stubError = new StubExchangeFunction();
        EstadoPagoBffController controllerError = new EstadoPagoBffController(WebClient.builder().exchangeFunction(stubError));
        ReflectionTestUtils.setField(controllerError, "ESTADO_PAGO_URL", baseUrl);

        ResponseEntity<List<Map<String, Object>>> error = controllerError.getEstadosPago().block();
        assertThat(error.getBody()).isEmpty();
    }
}
