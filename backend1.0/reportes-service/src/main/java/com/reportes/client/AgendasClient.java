package com.reportes.client;

import com.reportes.dto.external.TareaVencimientoExternalDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
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
public class AgendasClient {

    private final RestTemplate restTemplate;

    @Value("${servicios.agendas.base-url}")
    private String baseUrl;

    private static final ParameterizedTypeReference<List<TareaVencimientoExternalDto>> VENCIMIENTOS_TYPE =
            new ParameterizedTypeReference<>() {};

    public List<TareaVencimientoExternalDto> obtenerVencimientosProximos(
            int dias, Long organizacionId, Long obraId, Long clienteId, Long proveedorId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            if (organizacionId != null && organizacionId > 0) {
                headers.set("X-Organizacion-Id", String.valueOf(organizacionId));
            }
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            String uri = org.springframework.web.util.UriComponentsBuilder
                    .fromHttpUrl(baseUrl + "/api/agenda/tareas/vencimientos-proximos")
                    .queryParam("dias", dias)
                    .queryParamIfPresent("obraId", java.util.Optional.ofNullable(obraId))
                    .queryParamIfPresent("clienteId", java.util.Optional.ofNullable(clienteId))
                    .queryParamIfPresent("proveedorId", java.util.Optional.ofNullable(proveedorId))
                    .toUriString();

            ResponseEntity<List<TareaVencimientoExternalDto>> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    entity,
                    VENCIMIENTOS_TYPE
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("No se pudieron obtener los vencimientos de agenda: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
