package com.documentos.service;

imporcom.documentos.dto.DocumentoDto;
import com.documentos.entity.Documento;
import com.documentos.enums.TipoDocumentoEnum;
import com.documentos.repository.DocumentoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mockito;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DocumentoServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void createWithFileReactive_guardaDocumento() {
        DocumentoRepository repo = Mockito.mock(DocumentoRepository.class);
        DocumentoService service = new DocumentoService(tempDir.toString(), repo);

        FilePart filePart = Mockito.mock(FilePart.class);
        when(filePart.filename()).thenReturn("archivo.pdf");
        when(filePart.transferTo(any(Path.class))).thenReturn(Mono.empty());

        Documento saved = new Documento();
        saved.setIdDocumento(1L);
        saved.setNombreArchivo("archivo.pdf");
        saved.setFecha(LocalDate.now());
        saved.setPathArchivo("obras/1/archivo.pdf");
        when(repo.save(any(Documento.class))).thenReturn(saved);

        Mono<DocumentoDto> mono = service.createWithFileReactive(
                "1",
                TipoDocumentoEnum.FACTURA,
                "obs",
                null,
                null,
                filePart
        );

        StepVerifier.create(mono)
                .assertNext(dto -> {
                    assertThat(dto.getId_documento()).isEqualTo(1L);
                    assertThat(dto.getNombre_archivo()).isEqualTo("archivo.pdf");
                    assertThat(dto.getPath_archivo()).isEqualTo("obras/1/archivo.pdf");
                })
                .verifyComplete();

        verify(repo).save(any(Documento.class));
    }

    @Test
    void finders_y_delete() {
        DocumentoRepository repo = Mockito.mock(DocumentoRepository.class);
        DocumentoService service = new DocumentoService(tempDir.toString(), repo);

        Documento doc = new Documento();
        doc.setIdDocumento(1L);
        doc.setNombreArchivo("a.pdf");
        doc.setFecha(LocalDate.now());
        doc.setPathArchivo("obras/1/a.pdf");

        when(repo.findByIdObra(1L)).thenReturn(List.of(doc));
        when(repo.findAll()).thenReturn(List.of(doc));
        when(repo.findById(1L)).thenReturn(Optional.of(doc));

        StepVerifier.create(service.findByObra(1L)).expectNextCount(1).verifyComplete();
        StepVerifier.create(service.findAll()).expectNextCount(1).verifyComplete();
        StepVerifier.create(service.findById(1L)).expectNextMatches(dto -> dto.getId_documento().equals(1L)).verifyComplete();

        StepVerifier.create(service.delete(1L)).verifyComplete();
        verify(repo).deleteById(1L);
    }

    @Test
    void findById_notFound() {
        DocumentoRepository repo = Mockito.mock(DocumentoRepository.class);
        DocumentoService service = new DocumentoService(tempDir.toString(), repo);
        when(repo.findById(99L)).thenReturn(Optional.empty());

        StepVerifier.create(service.findById(99L))
                .expectErrorMatches(err -> err instanceof RuntimeException && err.getMessage().contains("Documento no encontrado"))
                .verify();
    }

    @Test
    void downloadFile_ok_y_archivoNoEncontrado() throws Exception {
        DocumentoRepository repo = Mockito.mock(DocumentoRepository.class);
        DocumentoService service = new DocumentoService(tempDir.toString(), repo);

        Path rel = Path.of("obras/1/archivo.txt");
        Path abs = tempDir.resolve(rel);
        Files.createDirectories(abs.getParent());
        Files.writeString(abs, "hola");

        Documento doc = new Documento();
        doc.setIdDocumento(1L);
        doc.setNombreArchivo("archivo.txt");
        doc.setFecha(LocalDate.now());
        doc.setPathArchivo(rel.toString());
        when(repo.findById(1L)).thenReturn(Optional.of(doc));

        Mono<ResponseEntity<Resource>> ok = service.downloadFile(1L);
        StepVerifier.create(ok)
                .assertNext(resp -> {
                    assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
                    assertThat(resp.getHeaders().getFirst("Content-Disposition")).contains("archivo.txt");
                })
                .verifyComplete();

        Documento docMissing = new Documento();
        docMissing.setIdDocumento(2L);
        docMissing.setNombreArchivo("missing.txt");
        docMissing.setFecha(LocalDate.now());
        docMissing.setPathArchivo("obras/2/missing.txt");
        when(repo.findById(2L)).thenReturn(Optional.of(docMissing));

        StepVerifier.create(service.downloadFile(2L))
                .expectErrorMatches(err -> err instanceof RuntimeException && err.getMessage().contains("Archivo no encontrado"))
                .verify();
    }

    @Test
    void createWithFileReactive_conAsociado() {
        DocumentoRepository repo = Mockito.mock(DocumentoRepository.class);
        DocumentoService service = new DocumentoService(tempDir.toString(), repo);

        FilePart filePart = Mockito.mock(FilePart.class);
        when(filePart.filename()).thenReturn("doc.pdf");
        when(filePart.transferTo(any(Path.class))).thenReturn(Mono.empty());

        Documento saved = new Documento();
        saved.setIdDocumento(2L);
        saved.setNombreArchivo("doc.pdf");
        saved.setFecha(LocalDate.now());
        saved.setPathArchivo("clientes/5/doc.pdf");
        when(repo.save(any(Documento.class))).thenReturn(saved);

        Mono<DocumentoDto> mono = service.createWithFileReactive(
                null,
                TipoDocumentoEnum.FACTURA,
                null,
                "5",
                "CLIENTE",
                filePart
        );

        StepVerifier.create(mono)
                .assertNext(dto -> assertThat(dto.getPath_archivo()).isEqualTo("clientes/5/doc.pdf"))
                .verifyComplete();
    }
}
