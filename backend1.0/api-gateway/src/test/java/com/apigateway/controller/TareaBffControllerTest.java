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

class TareaBffControllerTest {

    @Test
    void tareas_ok() {
        String baseUrl = "http://obras/tareas";
        StubExchangeFunction stub = new StubExchangeFunction();
        stub.stub(HttpMethod.GET, baseUrl + "/1", HttpStatus.OK, List.of(Map.of("id", 1)));
        stub.stub(HttpMethod.GET, baseUrl + "/proveedor/10", HttpStatus.OK, List.of(Map.of("id", 2)));
        stub.stub(HttpMethod.POST, baseUrl + "/1", HttpStatus.OK, Map.of("id", 3));
        stub.stub(HttpMethod.PUT, baseUrl + "/1", HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.PUT, baseUrl + "/1/completar", HttpStatus.OK, Map.of("id", 1, "estado", "COMPLETADA"));
        stub.stub(HttpMethod.DELETE, baseUrl + "/1", HttpStatus.OK, null);

        TareaBffController controller = new TareaBffController(WebClient.builder().exchangeFunction(stub));
        ReflectionTestUtils.setField(controller, "TAREAS_URL", baseUrl);

        ResponseEntity<List<Map<String, Object>>> porObra = controller.getTareasPorObra(1L).block();
        ResponseEntity<List<Map<String, Object>>> porProveedor = controller.getTareasPorProveedor(10L).block();
        ResponseEntity<Map<String, Object>> crear = controller.crearTarea(1L, Map.of("x", 1)).block();
        ResponseEntity<Map<String, Object>> actualizar = controller.actualizarTarea(1L, Map.of("x", 2)).block();
        ResponseEntity<Map<String, Object>> completar = controller.completarTarea(1L).block();
        ResponseEntity<Void> borrar = controller.borrarTarea(1L).block();

        assertThat(porObra.getBody()).hasSize(1);
        assertThat(porProveedor.getBody()).hasSize(1);
        assertThat(crear.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(actualizar.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(completar.getBody()).containsEntry("estado", "COMPLETADA");
        assertThat(borrar).isNull();
    }
}
