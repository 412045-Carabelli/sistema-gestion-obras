package com.apigateway.controller;

import com.apigateway.testutil.StubExchangeFunction;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ClienteBffControllerTest {

    @Test
    void clienteEndpoints_ok_y_error() {
        StubExchangeFunction stub = new StubExchangeFunction();
        String baseUrl = "http://clientes";

        stub.stub(HttpMethod.GET, baseUrl, HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.GET, baseUrl + "/1", HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.POST, baseUrl, HttpStatus.OK, Map.of("id", 2));
        stub.stub(HttpMethod.PUT, baseUrl + "/1", HttpStatus.OK, Map.of("id", 1, "nombre", "Nuevo"));
        stub.stub(HttpMethod.DELETE, baseUrl + "/1", HttpStatus.NO_CONTENT, null);
        stub.stub(HttpMethod.GET, baseUrl + "/condicion-iva", HttpStatus.OK, List.of(Map.of("id", 1)));

        WebClient.Builder builder = WebClient.builder().exchangeFunction(stub);
        ClienteBffController controller = new ClienteBffController(builder);
        ReflectionTestUtils.setField(controller, "CLIENTES_URL", baseUrl);

        ResponseEntity<List<Map<String, Object>>> listResp = controller.getAllClientes().block();
        ResponseEntity<Map<String, Object>> getResp = controller.getClienteById(1L).block();
        ResponseEntity<Map<String, Object>> createResp = controller.createCliente(Map.of("nombre", "A")).block();
        ResponseEntity<Map<String, Object>> updateResp = controller.updateCliente(1L, Map.of("nombre", "B")).block();
        ResponseEntity<Object> deleteResp = controller.deleteCliente(1L).block();
        ResponseEntity<List<Map<String, Object>>> ivaResp = controller.getCondicionIva().block();

        assertThat(listResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResp.getBody()).containsEntry("id", 1);
        assertThat(createResp.getBody()).containsEntry("id", 2);
        assertThat(updateResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(deleteResp.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(ivaResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        // error branch
        ResponseEntity<Map<String, Object>> notFound = controller.getClienteById(99L).block();
        assertThat(notFound.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
