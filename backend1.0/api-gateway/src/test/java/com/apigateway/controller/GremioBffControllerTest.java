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

class GremioBffControllerTest {

    @Test
    void gremioEndpoints_ok_y_error() {
        String baseProveedores = "http://proveedores/api/proveedores";
        String baseGremios = "http://proveedores/api/gremios";
        StubExchangeFunction stub = new StubExchangeFunction();
        stub.stub(HttpMethod.GET, baseGremios, HttpStatus.OK, List.of(Map.of("id", 1)));
        stub.stub(HttpMethod.GET, baseGremios + "/1", HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.POST, baseGremios, HttpStatus.OK, Map.of("id", 2));
        stub.stub(HttpMethod.PUT, baseGremios + "/1", HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.DELETE, baseGremios + "/1", HttpStatus.NO_CONTENT, null);

        GremioBffController controller = new GremioBffController(WebClient.builder().exchangeFunction(stub));
        ReflectionTestUtils.setField(controller, "PROVEEDORES_URL", baseProveedores);

        ResponseEntity<List<Map<String, Object>>> listResp = controller.getAll().block();
        ResponseEntity<Map<String, Object>> getResp = controller.getOne(1L).block();
        ResponseEntity<Map<String, Object>> createResp = controller.create(Map.of("nombre", "x")).block();
        ResponseEntity<Map<String, Object>> updateResp = controller.update(1L, Map.of("nombre", "y")).block();
        ResponseEntity<Void> deleteResp = controller.delete(1L).block();

        assertThat(listResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResp.getBody()).containsEntry("id", 1);
        assertThat(createResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updateResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(deleteResp.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        // error branch
        ResponseEntity<Map<String, Object>> notFound = controller.getOne(99L).block();
        assertThat(notFound.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
