package com.documentos.controller;

import com.documentos.dto.EstadoResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TipoDocumentoControllerTest {

    @Test
    void getAll_y_getByTipo() {
        TipoDocumentoController controller = new TipoDocumentoController();

        ResponseEntity<List<EstadoResponse>> all = controller.getAll();
        ResponseEntity<EstadoResponse> ok = controller.getByTipo("factura");
        ResponseEntity<EstadoResponse> notFound = controller.getByTipo("nope");

        assertThat(all.getBody()).isNotEmpty();
        assertThat(ok.getBody().label()).contains("Factura");
        assertThat(notFound.getStatusCode().is4xxClientError()).isTrue();
    }
}
