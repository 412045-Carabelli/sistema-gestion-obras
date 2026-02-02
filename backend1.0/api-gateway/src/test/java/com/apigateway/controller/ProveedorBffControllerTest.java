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

class ProveedorBffControllerTest {

    @Test
    void proveedorEndpoints_ok_y_error() {
        String baseUrl = "http://proveedores";
        StubExchangeFunction stub = new StubExchangeFunction();
        stub.stub(HttpMethod.GET, baseUrl, HttpStatus.OK, List.of(Map.of("id", 1)));
        stub.stub(HttpMethod.GET, baseUrl + "/all", HttpStatus.OK, List.of(Map.of("id", 1), Map.of("id", 2)));
        stub.stub(HttpMethod.GET, baseUrl + "/1", HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.POST, baseUrl, HttpStatus.OK, Map.of("id", 2));
        stub.stub(HttpMethod.PUT, baseUrl + "/1", HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.DELETE, baseUrl + "/1", HttpStatus.OK, null);

        ProveedorBffController controller = new ProveedorBffController(WebClient.builder().exchangeFunction(stub));
        ReflectionTestUtils.setField(controller, "PROVEEDORES_URL", baseUrl);

        ResponseEntity<List<Map<String, Object>>> listResp = controller.getAllProveedores().block();
        ResponseEntity<List<Map<String, Object>>> listAllResp = controller.getAllProveedoresSinFiltro().block();
        ResponseEntity<Map<String, Object>> getResp = controller.getProveedorById(1L).block();
        ResponseEntity<Map<String, Object>> createResp = controller.crearProveedor(Map.of("x", 1)).block();
        ResponseEntity<Map<String, Object>> updateResp = controller.actualizarProveedor(1L, Map.of("x", 2)).block();
        ResponseEntity<Void> deleteResp = controller.eliminarProveedor(1L).block();

        assertThat(listResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listAllResp.getBody()).hasSize(2);
        assertThat(getResp.getBody()).containsEntry("id", 1);
        assertThat(createResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updateResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(deleteResp).isNull();

        ResponseEntity<Map<String, Object>> notFound = controller.getProveedorById(99L).block();
        assertThat(notFound.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
