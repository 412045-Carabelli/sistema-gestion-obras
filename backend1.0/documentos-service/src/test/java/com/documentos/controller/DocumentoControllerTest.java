package com.documentos.controller;

import com.documentos.dto.DocumentoDto;
import com.documentos.enums.TipoDocumentoEnum;
import com.documentos.service.DocumentoService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class DocumentoControllerTest {

    @Test
    void create_validaTipo() {
        DocumentoService service = Mockito.mock(DocumentoService.class);
        DocumentoController controller = new DocumentoController(service);

        FilePart filePart = Mockito.mock(FilePart.class);
        when(service.createWithFileReactive(any(), any(), any(), any(), any(), any()))
                .thenReturn(Mono.just(new DocumentoDto()));

        ResponseEntity<DocumentoDto> ok = controller.create(
                "1", "FACTURA", null, null, null, filePart).block();
        ResponseEntity<DocumentoDto> bad = controller.create(
                "1", "INVALIDO", null, null, null, filePart).block();

        assertThat(ok.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(bad.getStatusCode().is4xxClientError()).isTrue();
    }

    @Test
    void endpoints_basicos() {
        DocumentoService service = Mockito.mock(DocumentoService.class);
        DocumentoController controller = new DocumentoController(service);

        DocumentoDto dto = new DocumentoDto();
        dto.setId_documento(1L);

        when(service.findByTipoAsociado("CLIENTE", 1L)).thenReturn(Flux.just(dto));
        when(service.findByObra(1L)).thenReturn(Flux.just(dto));
        when(service.findAll()).thenReturn(Flux.just(dto));
        when(service.findById(1L)).thenReturn(Mono.just(dto));
        when(service.findById(2L)).thenReturn(Mono.empty());
        when(service.delete(1L)).thenReturn(Mono.empty());
        when(service.downloadFile(1L)).thenReturn(Mono.just(ResponseEntity.ok(new ByteArrayResource(new byte[]{1}))));

        List<DocumentoDto> porAsociado = controller.getDocumentosPorAsociado("cliente", 1L).collectList().block();
        List<DocumentoDto> porObra = controller.getDocumentosPorObra(1L).collectList().block();
        List<DocumentoDto> all = controller.getAllDocumentos().collectList().block();
        ResponseEntity<DocumentoDto> byId = controller.getDocumentoById(1L).block();
        ResponseEntity<DocumentoDto> notFound = controller.getDocumentoById(2L).block();
        controller.deleteDocumento(1L).block();
        ResponseEntity<?> download = controller.view(1L).block();

        assertThat(porAsociado).hasSize(1);
        assertThat(porObra).hasSize(1);
        assertThat(all).hasSize(1);
        assertThat(byId.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(notFound.getStatusCode().is4xxClientError()).isTrue();
        assertThat(download.getStatusCode().is2xxSuccessful()).isTrue();
    }
}
