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

class ObraBffControllerTest {

    @Test
    void obraEndpoints_ok() {
        String obrasUrl = "http://obras";
        String clientesUrl = "http://clientes";
        String costosUrl = "http://obras/costos";
        String tareasUrl = "http://obras/tareas";
        String proveedoresUrl = "http://proveedores";

        StubExchangeFunction stub = new StubExchangeFunction();
        stub.stub(HttpMethod.POST, obrasUrl, HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.PUT, obrasUrl + "/1", HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.PATCH, obrasUrl + "/1/estado/EN_PROGRESO", HttpStatus.NO_CONTENT, null);
        stub.stub(HttpMethod.PATCH, obrasUrl + "/1/activo", HttpStatus.NO_CONTENT, null);

        List<Map<String, Object>> obras = List.of(
                Map.of("id", 1, "id_cliente", 1),
                Map.of("id", 2)
        );
        stub.stub(HttpMethod.GET, obrasUrl, HttpStatus.OK, obras);
        stub.stub(HttpMethod.GET, clientesUrl + "/1", HttpStatus.OK, Map.of("id", 1, "nombre", "Cliente"));

        stub.stub(HttpMethod.GET, obrasUrl + "/1", HttpStatus.OK, Map.of("id", 1, "id_cliente", 1));
        stub.stub(HttpMethod.GET, costosUrl + "/1", HttpStatus.OK, List.of(Map.of("id", 10, "id_proveedor", 10)));
        stub.stub(HttpMethod.GET, tareasUrl + "/1", HttpStatus.OK, List.of(Map.of("id", 20, "id_proveedor", 10)));
        stub.stub(HttpMethod.GET, proveedoresUrl + "/10", HttpStatus.OK, Map.of("id", 10, "nombre", "Prov"));

        ObraBffController controller = new ObraBffController(WebClient.builder().exchangeFunction(stub));
        ReflectionTestUtils.setField(controller, "OBRAS_URL", obrasUrl);
        ReflectionTestUtils.setField(controller, "CLIENTES_URL", clientesUrl);
        ReflectionTestUtils.setField(controller, "COSTOS_URL", costosUrl);
        ReflectionTestUtils.setField(controller, "TAREAS_URL", tareasUrl);
        ReflectionTestUtils.setField(controller, "PROVEEDORES_URL", proveedoresUrl);

        ResponseEntity<Map<String, Object>> crear = controller.crearObra(Map.of("x", 1)).block();
        ResponseEntity<Map<String, Object>> actualizar = controller.actualizarObra(1L, Map.of("x", 2)).block();
        ResponseEntity<Object> cambiarEstado = controller.cambiarEstadoObra(1L, "EN_PROGRESO").block();
        ResponseEntity<Object> actualizarActivo = controller.actualizarActivo(1L).block();
        ResponseEntity<List<Map<String, Object>>> todas = controller.getTodasLasObras().block();
        ResponseEntity<Map<String, Object>> completa = controller.getObraCompleta(1L).block();

        assertThat(crear.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(actualizar.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(cambiarEstado.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(actualizarActivo.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(todas.getBody()).hasSize(2);

        Map<String, Object> obraCompleta = completa.getBody();
        assertThat(obraCompleta).containsKeys("cliente", "costos", "tareas");
        assertThat(obraCompleta).doesNotContainKey("id_cliente");
    }
}
