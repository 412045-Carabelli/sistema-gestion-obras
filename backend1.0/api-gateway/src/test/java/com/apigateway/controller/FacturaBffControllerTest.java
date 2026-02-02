package com.apigateway.controller;

import com.apigateway.testutil.StubExchangeFunction;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.http.server.reactive.MockServerHttpResponse;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class FacturaBffControllerTest {

    @Test
    void facturaEndpoints_ok_y_download() {
        String baseUrl = "http://facturas";
        StubExchangeFunction stub = new StubExchangeFunction();
        stub.stub(HttpMethod.GET, baseUrl, HttpStatus.OK, List.of(Map.of("id", 1)));
        stub.stub(HttpMethod.GET, baseUrl + "/1", HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.GET, baseUrl + "/cliente/1", HttpStatus.OK, List.of(Map.of("id", 2)));
        stub.stub(HttpMethod.GET, baseUrl + "/obra/1", HttpStatus.OK, List.of(Map.of("id", 3)));
        stub.stub(HttpMethod.POST, baseUrl, HttpStatus.OK, Map.of("id", 4));
        stub.stub(HttpMethod.PUT, baseUrl + "/1", HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.DELETE, baseUrl + "/1", HttpStatus.OK, null);
        stub.stub(HttpMethod.GET, baseUrl + "/1/download", HttpStatus.OK, "data");

        FacturaBffController controller = new FacturaBffController(WebClient.builder().exchangeFunction(stub));
        ReflectionTestUtils.setField(controller, "FACTURAS_URL", baseUrl);

        ResponseEntity<List<Map<String, Object>>> all = controller.getAll().block();
        ResponseEntity<Map<String, Object>> byId = controller.getById(1L).block();
        ResponseEntity<List<Map<String, Object>>> byCliente = controller.getByCliente(1L).block();
        ResponseEntity<List<Map<String, Object>>> byObra = controller.getByObra(1L).block();
        ResponseEntity<Map<String, Object>> create = controller.create("1", null, "10", "5", "2024-01-01", null, null, null, null).block();
        ResponseEntity<Map<String, Object>> update = controller.update(1L, "1", "1", "10", "5", "2024-01-01", "desc", "ACTIVA", "true", null).block();
        ResponseEntity<Void> delete = controller.delete(1L).block();

        assertThat(all.getBody()).hasSize(1);
        assertThat(byId.getBody()).containsEntry("id", 1);
        assertThat(byCliente.getBody()).hasSize(1);
        assertThat(byObra.getBody()).hasSize(1);
        assertThat(create.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(update.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(delete.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        MockServerHttpResponse response = new MockServerHttpResponse();
        controller.download(1L, response).block();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        MockServerHttpResponse responseError = new MockServerHttpResponse();
        FacturaBffController controllerError = new FacturaBffController(WebClient.builder().exchangeFunction(new StubExchangeFunction()));
        ReflectionTestUtils.setField(controllerError, "FACTURAS_URL", baseUrl);
        controllerError.download(99L, responseError).block();
        assertThat(responseError.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
