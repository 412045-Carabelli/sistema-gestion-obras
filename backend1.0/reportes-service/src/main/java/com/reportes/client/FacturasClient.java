package com.reportes.client;

import com.reportes.dto.external.FacturaExternalDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class FacturasClient {

    private final RestTemplate restTemplate;

    @Value("${servicios.facturas.base-url}")
    private String baseUrl;

    private static final ParameterizedTypeReference<List<FacturaExternalDto>> FACTURAS_TYPE =
            new ParameterizedTypeReference<>() {};

    public List<FacturaExternalDto> obtenerFacturas() {
        try {
            ResponseEntity<List<FacturaExternalDto>> response = restTemplate.exchange(
                    baseUrl + "/api/facturas",
                    HttpMethod.GET,
                    null,
                    FACTURAS_TYPE
            );
            List<FacturaExternalDto> result = response.getBody() != null ? response.getBody() : Collections.emptyList();
            log.info("Facturas obtenidas del endpoint /api/facturas: {}", result.size());
            return result;
        } catch (RestClientException e) {
            log.warn("No se pudieron obtener las facturas del endpoint: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<FacturaExternalDto> obtenerFacturasPorObra(Long obraId) {
        try {
            ResponseEntity<List<FacturaExternalDto>> response = restTemplate.exchange(
                    baseUrl + "/api/facturas/obra/" + obraId,
                    HttpMethod.GET,
                    null,
                    FACTURAS_TYPE
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.debug("No se pudieron obtener facturas para obra {}: {}", obraId, e.getMessage());
            return Collections.emptyList();
        }
    }
}
