package com.reportes.client;

import com.reportes.dto.external.ClienteExternalDto;
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
public class ClientesClient {

    private final RestTemplate restTemplate;

    @Value("${servicios.clientes.base-url}")
    private String baseUrl;

    private static final ParameterizedTypeReference<List<ClienteExternalDto>> CLIENTES_TYPE =
            new ParameterizedTypeReference<>() {};

    public List<ClienteExternalDto> obtenerClientes() {
        try {
            ResponseEntity<List<ClienteExternalDto>> response = restTemplate.exchange(
                    baseUrl + "/api/clientes",
                    HttpMethod.GET,
                    null,
                    CLIENTES_TYPE
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("No se pudieron obtener los clientes: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
