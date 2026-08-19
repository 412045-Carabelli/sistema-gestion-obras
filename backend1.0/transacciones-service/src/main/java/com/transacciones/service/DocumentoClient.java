package com.transacciones.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Cliente hacia documentos-service para que los adjuntos de facturas
 * queden en MinIO (via documentos-service) en lugar del disco local
 * del contenedor de transacciones-service.
 */
@Slf4j
@Service
public class DocumentoClient {

    private final RestTemplate restTemplate;
    private final String documentosUrl;

    public DocumentoClient(RestTemplate restTemplate, @Value("${services.documentos.url}") String documentosUrl) {
        this.restTemplate = restTemplate;
        this.documentosUrl = documentosUrl;
    }

    public Long subirDocumentoFactura(Long idObra, Long idCliente, MultipartFile file) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            if (idObra != null) {
                body.add("id_obra", String.valueOf(idObra));
            }
            body.add("tipo_documento", "FACTURA");
            if (idCliente != null) {
                body.add("id_asociado", String.valueOf(idCliente));
                body.add("tipo_asociado", "CLIENTE");
            }
            String filename = file.getOriginalFilename();
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };
            body.add("file", fileResource);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(documentosUrl, request, Map.class);
            Object id = response.getBody() != null ? response.getBody().get("id_documento") : null;
            if (id == null) {
                throw new RuntimeException("documentos-service no devolvio id de documento");
            }
            return ((Number) id).longValue();
        } catch (IOException e) {
            throw new RuntimeException("No se pudo leer el archivo de la factura", e);
        }
    }

    public void eliminarDocumento(Long idDocumento) {
        if (idDocumento == null) return;
        try {
            restTemplate.delete(documentosUrl + "/" + idDocumento);
        } catch (Exception e) {
            log.warn("No se pudo eliminar documento {} en documentos-service: {}", idDocumento, e.getMessage());
        }
    }

    public ResponseEntity<byte[]> verDocumento(Long idDocumento) {
        return restTemplate.getForEntity(documentosUrl + "/" + idDocumento + "/view", byte[].class);
    }
}
