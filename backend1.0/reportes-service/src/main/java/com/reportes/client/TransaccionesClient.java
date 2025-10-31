package com.reportes.client;

import com.reportes.dto.external.TransaccionExternalDto;
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
public class TransaccionesClient {

    private final RestTemplate restTemplate;

    @Value("${servicios.transacciones.base-url}")
    private String baseUrl;

    private static final ParameterizedTypeReference<List<TransaccionExternalDto>> TRANSACCIONES_TYPE =
            new ParameterizedTypeReference<>() {};

    public List<TransaccionExternalDto> obtenerTransacciones() {
        try {
            ResponseEntity<List<TransaccionExternalDto>> response = restTemplate.exchange(
                    baseUrl + "/api/transacciones",
                    HttpMethod.GET,
                    null,
                    TRANSACCIONES_TYPE
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("No se pudieron obtener las transacciones: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
