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

class TipoTransaccionBffControllerTest {

    @Test
    void tipoTransaccion_ok_y_notFound() {
        String baseUrl = "http://transacciones/tipo-transaccion";
        StubExchangeFunction stub = new StubExchangeFunction();
        stub.stub(HttpMethod.GET, baseUrl, HttpStatus.OK, List.of(Map.of("tipo", "COBRO")));
        stub.stub(HttpMethod.GET, baseUrl + "/COBRO", HttpStatus.OK, Map.of("tipo", "COBRO"));

        TipoTransaccionBffController controller = new TipoTransaccionBffController(WebClient.builder().exchangeFunction(stub));
        ReflectionTestUtils.setField(controller, "TIPO_TRANSACCIONES_URL", baseUrl);

        ResponseEntity<List<Map<String, Object>>> listResp = controller.getAllTipos().block();
        ResponseEntity<Map<String, Object>> getResp = controller.getTipoByNombre("COBRO").block();

        assertThat(listResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResp.getBody()).containsEntry("tipo", "COBRO");

        ResponseEntity<Map<String, Object>> notFound = controller.getTipoByNombre("XX").block();
        assertThat(notFound.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
