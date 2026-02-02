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

class TipoDocumentoBffControllerTest {

    @Test
    void tipoDocumento_ok_y_notFound() {
        String baseUrl = "http://documentos/tipo-documentos";
        StubExchangeFunction stub = new StubExchangeFunction();
        stub.stub(HttpMethod.GET, baseUrl, HttpStatus.OK, List.of(Map.of("tipo", "A")));
        stub.stub(HttpMethod.GET, baseUrl + "/A", HttpStatus.OK, Map.of("tipo", "A"));
        stub.stub(HttpMethod.POST, baseUrl, HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.PUT, baseUrl + "/1", HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.DELETE, baseUrl + "/1", HttpStatus.NO_CONTENT, null);

        TipoDocumentoBffController controller = new TipoDocumentoBffController(WebClient.builder().exchangeFunction(stub));
        ReflectionTestUtils.setField(controller, "TIPO_DOC_URL", baseUrl);

        ResponseEntity<List<Map<String, Object>>> listResp = controller.getAll().block();
        ResponseEntity<Map<String, Object>> getResp = controller.getByTipo("A").block();
        ResponseEntity<Map<String, Object>> createResp = controller.create(Map.of("tipo", "B")).block();
        ResponseEntity<Map<String, Object>> updateResp = controller.update(1L, Map.of("tipo", "C")).block();
        ResponseEntity<Void> deleteResp = controller.delete(1L).block();

        assertThat(listResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResp.getBody()).containsEntry("tipo", "A");
        assertThat(createResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updateResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(deleteResp.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        ResponseEntity<Map<String, Object>> notFound = controller.getByTipo("Z").block();
        assertThat(notFound.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
