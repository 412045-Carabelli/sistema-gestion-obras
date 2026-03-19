package com.documentos.service;

import com.documentos.dto.DocumentoDto;
import com.documentos.entity.Documento;
import com.documentos.enums.TipoDocumentoEnum;
import com.documentos.mapper.DocumentosMapper;
import com.documentos.repository.DocumentoRepository;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.UploadObjectArgs;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
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
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DocumentoService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentoService.class);
    private final String uploadDirBase;
    private final DocumentoRepository documentoRepository;
    private final MinioClient minioClient;
    private final boolean minioEnabled;
    private final String minioBucket;

    @Autowired
    public DocumentoService(@Value("${file.upload-dir}") String uploadDirBase,
                            DocumentoRepository documentoRepository,
                            @Autowired(required = false) MinioClient minioClient,
                            @Value("${minio.enabled:false}") boolean minioEnabled,
                            @Value("${minio.bucket:documentos}") String minioBucket) {
        this.uploadDirBase = uploadDirBase;
        this.documentoRepository = documentoRepository;
        this.minioClient = minioClient;
        this.minioEnabled = minioEnabled && minioClient != null;
        this.minioBucket = minioBucket;
    }

    public Mono<DocumentoDto> createWithFileReactive(
            String idObra,
            TipoDocumentoEnum tipoDocumento,
            String observacion,
            String idAsociado,
            String tipoAsociado,
            FilePart filePart) {

        boolean tieneArchivo = filePart != null && filePart.filename() != null && !filePart.filename().isBlank();
        boolean tieneObservacion = observacion != null && !observacion.trim().isEmpty();
        if (!tieneArchivo && !tieneObservacion) {
            return Mono.error(new IllegalArgumentException("Debes indicar un archivo o una nota."));
        }

        String folder = (tipoAsociado != null && !tipoAsociado.isEmpty())
                ? tipoAsociado.toLowerCase() + "s/" + idAsociado
                : "obras/" + (idObra != null ? idObra : "sin-obra");

        String relativePath = tieneArchivo ? folder + "/" + filePart.filename() : "";
        Path destPath = tieneArchivo
                ? Paths.get(uploadDirBase, relativePath).normalize().toAbsolutePath()
                : null;

        Mono<Void> storageMono;
        if (!tieneArchivo) {
            storageMono = Mono.empty();
        } else if (minioEnabled) {
            storageMono = uploadToMinio(relativePath, filePart)
                    .doOnSuccess(v -> logger.info("Documento guardado en MinIO: {}", relativePath));
        } else {
            storageMono = Mono.fromRunnable(() -> {
                try {
                    Files.createDirectories(destPath.getParent());
                } catch (IOException e) {
                    throw new RuntimeException("No se pudo crear el directorio para la subida de archivos.", e);
                }
            }).then(filePart.transferTo(destPath))
                    .doOnSuccess(v -> logger.info("Documento guardado en filesystem: {}", destPath));
        }

        return storageMono.then(
                Mono.fromCallable(() -> {
                    DocumentoDto dto = new DocumentoDto();
                    dto.setId_obra(idObra != null ? Long.parseLong(idObra) : null);
                    dto.setId_asociado(idAsociado != null ? Long.parseLong(idAsociado) : null);
                    dto.setTipo_asociado(tipoAsociado);
                    dto.setNombre_archivo(tieneArchivo ? filePart.filename() : "");
                    dto.setPath_archivo(relativePath);
                    dto.setObservacion(observacion);
                    dto.setFecha(LocalDate.now().toString());
                    dto.setTipo_documento(tipoDocumento);

                    Documento entity = DocumentosMapper.toEntity(dto);
                    Documento saved = documentoRepository.save(entity);
                    return DocumentosMapper.toDto(saved);
                }).subscribeOn(Schedulers.boundedElastic())
        );
    }

    @Transactional(readOnly = true)
    public Flux<DocumentoDto> findByTipoAsociado(String tipo, Long idAsociado, Long idObra) {
        return Mono.fromCallable(() -> (idObra != null
                        ? documentoRepository.findByTipoAsociadoAndIdAsociadoAndIdObra(tipo, idAsociado, idObra)
                        : documentoRepository.findByTipoAsociadoAndIdAsociado(tipo, idAsociado))
                .stream()
                .map(DocumentosMapper::toDto)
                .collect(Collectors.toList()))
                .flatMapMany(Flux::fromIterable)
                .subscribeOn(Schedulers.boundedElastic());
    }

    @Transactional(readOnly = true)
    public Flux<DocumentoDto> findByObra(Long obraId) {
        return Mono.fromCallable(() -> documentoRepository.findByIdObra(obraId)
                        .stream()
                        .map(DocumentosMapper::toDto)
                        .collect(Collectors.toList()))
                .flatMapMany(Flux::fromIterable)
                .subscribeOn(Schedulers.boundedElastic());
    }

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

    @Transactional(readOnly = true)
    public Mono<DocumentoDto> findById(Long id) {
        return Mono.fromCallable(() ->
                        documentoRepository.findById(id)
                                .map(DocumentosMapper::toDto)
                                .orElseThrow(() -> new RuntimeException("Documento no encontrado con ID: " + id))
                )
                .subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<Void> delete(Long id) {
        return Mono.fromRunnable(() -> {
                    Documento documento = documentoRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Documento no encontrado con ID: " + id));
                    if (documento.getPathArchivo() == null || documento.getPathArchivo().isBlank()) {
                        documentoRepository.deleteById(id);
                        return;
                    }
                    if (minioEnabled) {
                        try {
                            minioClient.removeObject(
                                    RemoveObjectArgs.builder()
                                            .bucket(minioBucket)
                                            .object(documento.getPathArchivo())
                                            .build()
                            );
                        } catch (Exception ignored) {
                        }
                    } else {
                        try {
                            Path filePath = Paths.get(uploadDirBase, documento.getPathArchivo()).normalize();
                            Files.deleteIfExists(filePath);
                        } catch (IOException ignored) {
                        }
                    }
                    documentoRepository.deleteById(id);
                })
                .subscribeOn(Schedulers.boundedElastic())
                .then();
    }

    public Mono<ResponseEntity<Resource>> downloadFile(Long id) {
        return Mono.fromCallable(() -> {
            Documento documento = documentoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Documento no encontrado con ID: " + id));

            if (documento.getPathArchivo() == null || documento.getPathArchivo().isBlank()) {
                byte[] bytes = Optional.ofNullable(documento.getObservacion()).orElse("").getBytes();
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"nota.txt\"")
                        .contentType(MediaType.TEXT_PLAIN)
                        .body((Resource) new ByteArrayResource(bytes));
            }

            if (minioEnabled) {
                StatObjectResponse stat = minioClient.statObject(
                        StatObjectArgs.builder()
                                .bucket(minioBucket)
                                .object(documento.getPathArchivo())
                                .build()
                );
                byte[] bytes;
                try (InputStream in = minioClient.getObject(
                        GetObjectArgs.builder()
                                .bucket(minioBucket)
                                .object(documento.getPathArchivo())
                                .build()
                )) {
                    bytes = in.readAllBytes();
                }

                MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;
                String detected = stat.contentType();
                if (detected != null && !detected.isBlank()) {
                    contentType = MediaType.parseMediaType(detected);
                }

                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + documento.getNombreArchivo() + "\"")
                        .contentType(contentType)
                        .body((Resource) new ByteArrayResource(bytes));
            }

            Path filePath = Paths.get(uploadDirBase, documento.getPathArchivo()).normalize();
            FileSystemResource resource = new FileSystemResource(filePath);

            if (!resource.exists()) {
                throw new RuntimeException("Archivo no encontrado: " + documento.getPathArchivo());
            }

            MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;
            try {
                String detected = Files.probeContentType(filePath);
                if (detected != null && !detected.isBlank()) {
                    contentType = MediaType.parseMediaType(detected);
                }
            } catch (IOException ignored) {
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + documento.getNombreArchivo() + "\"")
                    .contentType(contentType)
                    .body((Resource) resource);
        }).subscribeOn(Schedulers.boundedElastic());
    }

    private Mono<Void> uploadToMinio(String objectName, FilePart filePart) {
        final String safeName = Optional.ofNullable(filePart.filename())
                .orElse("archivo")
                .replaceAll("[^a-zA-Z0-9._-]", "_");
        return Mono.usingWhen(
                Mono.fromCallable(() -> Files.createTempFile("doc-", "-" + safeName))
                        .subscribeOn(Schedulers.boundedElastic()),
                temp -> filePart.transferTo(temp)
                        .then(Mono.fromCallable(() -> {
                            UploadObjectArgs.Builder builder = UploadObjectArgs.builder()
                                    .bucket(minioBucket)
                                    .object(objectName)
                                    .filename(temp.toString());
                            if (filePart.headers().getContentType() != null) {
                                builder.contentType(filePart.headers().getContentType().toString());
                            }
                            minioClient.uploadObject(builder.build());
                            return temp;
                        }).subscribeOn(Schedulers.boundedElastic()))
                        .then(),
                temp -> Mono.fromRunnable(() -> {
                    try {
                        Files.deleteIfExists(temp);
                    } catch (IOException ignored) {
                    }
                }).subscribeOn(Schedulers.boundedElastic())
        );
    }
}
