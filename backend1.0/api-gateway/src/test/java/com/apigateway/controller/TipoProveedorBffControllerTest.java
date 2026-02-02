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

class TipoProveedorBffControllerTest {

    @Test
    void tipoProveedor_ok_y_error() {
        String baseUrl = "http://proveedores/tipo-proveedor";
        StubExchangeFunction stub = new StubExchangeFunction();
        stub.stub(HttpMethod.GET, baseUrl, HttpStatus.OK, List.of(Map.of("id", 1)));
        stub.stub(HttpMethod.POST, baseUrl, HttpStatus.OK, Map.of("id", 2));

        TipoProveedorBffController controller = new TipoProveedorBffController(WebClient.builder().exchangeFunction(stub));
        ReflectionTestUtils.setField(controller, "PROVEEDORES_URL", baseUrl);

        ResponseEntity<List<Map<String, Object>>> listResp = controller.getProveedores().block();
        ResponseEntity<Map<String, Object>> createResp = controller.createTipo(Map.of("nombre", "x")).block();

        assertThat(listResp.getBody()).hasSize(1);
        assertThat(createResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        // error branch
        TipoProveedorBffController controllerError = new TipoProveedorBffController(WebClient.builder().exchangeFunction(new StubExchangeFunction()));
        ReflectionTestUtils.setField(controllerError, "PROVEEDORES_URL", baseUrl);
        ResponseEntity<Map<String, Object>> bad = controllerError.createTipo(Map.of()).block();
        assertThat(bad.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
