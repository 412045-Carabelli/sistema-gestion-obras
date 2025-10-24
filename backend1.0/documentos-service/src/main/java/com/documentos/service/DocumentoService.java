package com.documentos.service;

import com.documentos.dto.DocumentoDto;
import com.documentos.entity.Documento;
import com.documentos.entity.TipoDocumento;
import com.documentos.mapper.DocumentosMapper;
import com.documentos.repository.DocumentoRepository;
import com.documentos.repository.TipoDocumentoRepository;
import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.stream.Collectors;

@Service
public class DocumentoService {

    private final String uploadDirBase;
    private final DocumentoRepository documentoRepository;
    private final TipoDocumentoRepository tipoDocumentoRepository;

    // Inyectamos la ruta base y los repositorios a través del constructor
    @Autowired
    public DocumentoService(@Value("${file.upload-dir}") String uploadDirBase,
                            DocumentoRepository documentoRepository,
                            TipoDocumentoRepository tipoDocumentoRepository) {
        this.uploadDirBase = uploadDirBase;
        this.documentoRepository = documentoRepository;
        this.tipoDocumentoRepository = tipoDocumentoRepository;
    }

    /**
     * Sube un archivo, lo guarda físicamente y crea el registro en la base de datos.
     */
    public Mono<DocumentoDto> createWithFileReactive(
            String idObra,
            String idTipoDocumento,
            String observacion,
            String idAsociado,
            String tipoAsociado,
            FilePart filePart) {

        // Definir la carpeta según si es obra, cliente o proveedor
        String folder = (tipoAsociado != null && !tipoAsociado.isEmpty())
                ? tipoAsociado.toLowerCase() + "s/" + idAsociado
                : "obras/" + idObra;

        String relativePath = folder + "/" + filePart.filename();
        Path destPath = Paths.get(uploadDirBase, relativePath).normalize().toAbsolutePath();

        Mono<Void> createDirectoriesMono = Mono.fromRunnable(() -> {
            try {
                Files.createDirectories(destPath.getParent());
            } catch (IOException e) {
                throw new RuntimeException("No se pudo crear el directorio para la subida de archivos.", e);
            }
        });

        return createDirectoriesMono
                .then(filePart.transferTo(destPath))
                .then(
                        Mono.fromCallable(() -> {
                            DocumentoDto dto = new DocumentoDto();
                            dto.setId_obra(idObra != null ? Long.parseLong(idObra) : null);
                            dto.setId_asociado(idAsociado != null ? Long.parseLong(idAsociado) : null);
                            dto.setTipo_asociado(tipoAsociado);
                            dto.setNombre_archivo(filePart.filename());
                            dto.setPath_archivo(relativePath);
                            dto.setObservacion(observacion);
                            dto.setFecha(LocalDate.now().toString());

                            TipoDocumento tipo = tipoDocumentoRepository.findById(Long.parseLong(idTipoDocumento))
                                    .orElseThrow(() -> new RuntimeException("Tipo documento no encontrado"));

                            Documento entity = DocumentosMapper.toEntity(dto, tipo);
                            Documento saved = documentoRepository.save(entity);
                            return DocumentosMapper.toDto(saved);
                        }).subscribeOn(Schedulers.boundedElastic())
                );
    }

    @Transactional(readOnly = true)
    public Flux<DocumentoDto> findByTipoAsociado(String tipo, Long idAsociado) {
        return Mono.fromCallable(() -> documentoRepository.findByTipoAsociadoAndIdAsociado(tipo, idAsociado)
                        .stream()
                        .map(DocumentosMapper::toDto)
                        .collect(Collectors.toList()))
                .flatMapMany(Flux::fromIterable)
                .subscribeOn(Schedulers.boundedElastic());
    }

    /**
     * Obtiene todos los documentos de una obra específica.
     */
    @Transactional(readOnly = true) // 1. La transacción envuelve toda la operación
    public Flux<DocumentoDto> findByObra(Long obraId) {
        return Mono.fromCallable(() -> {
                    // 2. La consulta Y el mapeo ocurren JUNTOS DENTRO de la transacción
                    return documentoRepository.findByIdObra(obraId)
                            .stream()
                            .map(DocumentosMapper::toDto) // La carga perezosa ocurre aquí, con la sesión abierta
                            .collect(Collectors.toList());
                })
                .flatMapMany(Flux::fromIterable) // Convierte el Mono<List<Dto>> en un Flux<Dto>
                .subscribeOn(Schedulers.boundedElastic()); // 3. Todo el bloque se ejecuta en un hilo seguro
    }

    /**
     * Obtiene todos los documentos.
     */
    @Transactional(readOnly = true)
    public Flux<DocumentoDto> findAll() {
        return Mono.fromCallable(() ->
                        documentoRepository.findAll()
                                .stream()
                                .map(DocumentosMapper::toDto)
                                .collect(Collectors.toList())
                )
                .flatMapMany(Flux::fromIterable)
                .subscribeOn(Schedulers.boundedElastic());
    }

    /**
     * Obtiene un documento por su ID.
     */
    @Transactional(readOnly = true)
    public Mono<DocumentoDto> findById(Long id) {
        return Mono.fromCallable(() ->
                        documentoRepository.findById(id)
                                .map(DocumentosMapper::toDto) // El mapeo ocurre dentro del bloque transaccional
                                .orElseThrow(() -> new RuntimeException("Documento no encontrado con ID: " + id))
                )
                .subscribeOn(Schedulers.boundedElastic());
    }

    /**
     * Elimina un documento por su ID.
     */
    public Mono<Void> delete(Long id) {
        // La eliminación también es una operación bloqueante
        return Mono.fromRunnable(() -> documentoRepository.deleteById(id))
                .subscribeOn(Schedulers.boundedElastic())
                .then(); // .then() convierte Mono<Runnable> en Mono<Void>
    }

    public Mono<ResponseEntity<Resource>> downloadFile(Long id) {
        return Mono.fromCallable(() -> {
            Documento documento = documentoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Documento no encontrado con ID: " + id));

            Path filePath = Paths.get(uploadDirBase, documento.getPathArchivo()).normalize();
            FileSystemResource resource = new FileSystemResource(filePath);

            if (!resource.exists()) {
                throw new RuntimeException("Archivo no encontrado: " + documento.getPathArchivo());
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + documento.getNombreArchivo() + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body((Resource) resource);
        }).subscribeOn(Schedulers.boundedElastic());
    }
}