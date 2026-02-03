package com.clientes.client;

import com.clientes.dto.TransaccionExternalDto;
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

@Component
@RequiredArgsConstructor
@Slf4j
public class TransaccionesClient {

    private final RestTemplate restTemplate;

    @Value("${services.transacciones.url:http://transacciones-service:8086/api/transacciones}")
    private String transaccionesBaseUrl;

    private static final ParameterizedTypeReference<List<TransaccionExternalDto>> TRANSACCION_TYPE =
            new ParameterizedTypeReference<>() {};

    public List<TransaccionExternalDto> obtenerTransaccionesPorAsociado(String tipo, Long id) {
        String url = String.format("%s/asociado/%s/%d", transaccionesBaseUrl, tipo, id);
        try {
            ResponseEntity<List<TransaccionExternalDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    TRANSACCION_TYPE
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException ex) {
            log.warn("No se pudieron obtener transacciones para {} {}: {}", tipo, id, ex.getMessage());
            return Collections.emptyList();
        }
    }
}
