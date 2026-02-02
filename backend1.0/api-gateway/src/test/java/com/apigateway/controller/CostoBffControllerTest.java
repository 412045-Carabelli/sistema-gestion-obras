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

class CostoBffControllerTest {

    @Test
    void costoEndpoints_ok_y_error() {
        StubExchangeFunction stub = new StubExchangeFunction();
        String baseUrl = "http://obras/costos";

        stub.stub(HttpMethod.GET, baseUrl + "/1", HttpStatus.OK, List.of(Map.of("id", 1)));
        stub.stub(HttpMethod.PUT, baseUrl + "/1/estado/PAGADO", HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.POST, baseUrl + "/1", HttpStatus.OK, Map.of("id", 10));
        stub.stub(HttpMethod.PUT, baseUrl + "/1", HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.DELETE, baseUrl + "/1", HttpStatus.NO_CONTENT, null);

        WebClient.Builder builder = WebClient.builder().exchangeFunction(stub);
        CostoBffController controller = new CostoBffController(builder);
        ReflectionTestUtils.setField(controller, "COSTOS_URL", baseUrl);

        ResponseEntity<List<Map<String, Object>>> listResp = controller.getCostosPorObra(1L).block();
        ResponseEntity<Map<String, Object>> estadoResp = controller.actualizarEstadoPago(1L, "PAGADO").block();
        ResponseEntity<Map<String, Object>> crearResp = controller.crearCosto(1L, Map.of("x", 1)).block();
        ResponseEntity<Map<String, Object>> actualizarResp = controller.actualizarCosto(1L, Map.of("x", 2)).block();
        ResponseEntity<Object> eliminarResp = controller.eliminarCosto(1L).block();

        assertThat(listResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(estadoResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(crearResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(actualizarResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(eliminarResp).isNull();

        // error branches
        ResponseEntity<Map<String, Object>> crearError = controller.crearCosto(99L, Map.of("x", 1)).block();
        ResponseEntity<Map<String, Object>> actualizarError = controller.actualizarCosto(99L, Map.of("x", 2)).block();
        ResponseEntity<Object> eliminarError = controller.eliminarCosto(99L).block();
        ResponseEntity<List<Map<String, Object>>> listError = controller.getCostosPorObra(99L).block();

        assertThat(crearError.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(actualizarError.getStatusCode().value()).isEqualTo(500);
        assertThat(eliminarError.getStatusCode().value()).isEqualTo(500);
        assertThat(listError.getBody()).isEmpty();
    }
}
