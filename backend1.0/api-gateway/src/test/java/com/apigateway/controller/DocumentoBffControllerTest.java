package com.apigateway.controller;

import com.apigateway.testutil.StubExchangeFunction;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.mock.http.server.reactive.MockServerHttpResponse;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;
import reactor.core.publisher.Flux;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

class DocumentoBffControllerTest {

    @Test
    void documentoEndpoints_ok_y_download() {
        String baseUrl = "http://documentos";
        StubExchangeFunction stub = new StubExchangeFunction();
        stub.stub(HttpMethod.POST, baseUrl, HttpStatus.OK, Map.of("id", 1));
        stub.stub(HttpMethod.GET, baseUrl + "/obra/1", HttpStatus.OK, List.of(Map.of("id", 1)));
        stub.stub(HttpMethod.DELETE, baseUrl + "/1", HttpStatus.OK, null);
        stub.stub(HttpMethod.GET, baseUrl + "/1/download", HttpStatus.OK, "data");
        stub.stub(HttpMethod.GET, baseUrl + "/asociado/OBRA/1", HttpStatus.OK, List.of(Map.of("id", 2)));

        DocumentoBffController controller = new DocumentoBffController(WebClient.builder().exchangeFunction(stub));
        ReflectionTestUtils.setField(controller, "DOCUMENTOS_URL", baseUrl);

        FilePart filePart = Mockito.mock(FilePart.class);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        when(filePart.filename()).thenReturn("file.pdf");
        when(filePart.headers()).thenReturn(headers);
        DataBuffer buffer = new DefaultDataBufferFactory().wrap("data".getBytes());
        when(filePart.content()).thenReturn(Flux.just(buffer));

        ResponseEntity<Map<String, Object>> createResp = controller.create(
                "1", "DOC", "obs", null, null, filePart).block();
        ResponseEntity<List<Map<String, Object>>> obraResp = controller.getDocumentosPorObra(1L).block();
        ResponseEntity<Void> deleteResp = controller.deleteDocumento(1L).block();
        ResponseEntity<List<Map<String, Object>>> asociadoResp = controller.getDocumentosPorAsociado("OBRA", 1L).block();

        assertThat(createResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(obraResp.getBody()).hasSize(1);
        assertThat(deleteResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(asociadoResp.getBody()).hasSize(1);

        MockServerHttpResponse response = new MockServerHttpResponse();
        controller.downloadDocumento(1L, response).block();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        MockServerHttpResponse responseError = new MockServerHttpResponse();
        DocumentoBffController controllerError = new DocumentoBffController(WebClient.builder().exchangeFunction(new StubExchangeFunction()));
        ReflectionTestUtils.setField(controllerError, "DOCUMENTOS_URL", baseUrl);
        controllerError.downloadDocumento(99L, responseError).block();
        assertThat(responseError.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
