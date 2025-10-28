package com.reportes.client;

import com.reportes.dto.external.ProveedorExternalDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProveedoresClient {

    private final RestTemplate restTemplate;

    @Value("${servicios.proveedores.base-url}")
    private String baseUrl;

    private static final ParameterizedTypeReference<List<ProveedorExternalDto>> PROVEEDORES_TYPE =
            new ParameterizedTypeReference<>() {};

    public List<ProveedorExternalDto> obtenerProveedores() {
        try {
            ResponseEntity<List<ProveedorExternalDto>> response = restTemplate.exchange(
                    baseUrl + "/api/proveedores/all",
                    HttpMethod.GET,
                    null,
                    PROVEEDORES_TYPE
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("No se pudieron obtener los proveedores: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
