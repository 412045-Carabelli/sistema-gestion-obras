package com.apigateway.controller;

import com.apigateway.testutil.StubExchangeFunction;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class TransaccionBffControllerTest {

    @Test
    void transacciones_ok_y_helpers() {
        String baseUrl = "http://transacciones";
        StubExchangeFunction stub = new StubExchangeFunction();
        stub.stub(HttpMethod.GET, baseUrl, HttpStatus.OK, List.of(Map.of("id", 1)));
        stub.stub(HttpMethod.GET, baseUrl + "/1", HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.GET, baseUrl + "/obra/1", HttpStatus.OK, List.of(Map.of("id", 2)));
        stub.stub(HttpMethod.POST, baseUrl, HttpStatus.OK, Map.of("id", 3));
        stub.stub(HttpMethod.PUT, baseUrl + "/1", HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.DELETE, baseUrl + "/1", HttpStatus.NO_CONTENT, null);
        stub.stub(HttpMethod.GET, baseUrl + "/asociado/PROVEEDOR/10", HttpStatus.OK, List.of(Map.of("id", 4)));

        TransaccionBffController controller = new TransaccionBffController(WebClient.builder().exchangeFunction(stub));
        ReflectionTestUtils.setField(controller, "TRANSACCIONES_URL", baseUrl);
        ReflectionTestUtils.setField(controller, "TIPO_TRANSACCIONES_URL", baseUrl + "/tipo-transaccion");
        ReflectionTestUtils.setField(controller, "OBRAS_URL", "http://obras");

        ResponseEntity<List<Map<String, Object>>> listResp = controller.getAllTransacciones().block();
        ResponseEntity<Map<String, Object>> getResp = controller.getTransaccionById(1L).block();
        ResponseEntity<List<Map<String, Object>>> porObra = controller.getTransaccionesByObra(1L).block();
        ResponseEntity<Map<String, Object>> createResp = controller.createTransaccion(Map.of("x", 1)).block();
        ResponseEntity<Map<String, Object>> updateResp = controller.updateTransaccion(1L, Map.of("x", 2)).block();
        ResponseEntity<Void> deleteResp = controller.deleteTransaccion(1L).block();
        ResponseEntity<List<Map<String, Object>>> porAsociado = controller.getTransaccionesPorAsociado("PROVEEDOR", 10L).block();

        assertThat(listResp.getBody()).hasSize(1);
        assertThat(getResp.getBody()).containsEntry("id", 1);
        assertThat(porObra.getBody()).hasSize(1);
        assertThat(createResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updateResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(deleteResp.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(porAsociado.getBody()).hasSize(1);

        ResponseEntity<Map<String, Object>> notFound = controller.getTransaccionById(99L).block();
        assertThat(notFound.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        Object parsedLong = ReflectionTestUtils.invokeMethod(controller, "parseLongSafe", "123");
        Object parsedBadLong = ReflectionTestUtils.invokeMethod(controller, "parseLongSafe", "abc");
        Object parsedBd = ReflectionTestUtils.invokeMethod(controller, "parseBigDecimal", "10.5");
        Object parsedBadBd = ReflectionTestUtils.invokeMethod(controller, "parseBigDecimal", "x");

        assertThat(parsedLong).isEqualTo(123L);
        assertThat(parsedBadLong).isNull();
        assertThat(parsedBd).isEqualTo(new BigDecimal("10.5"));
        assertThat(parsedBadBd).isNull();
    }
}
