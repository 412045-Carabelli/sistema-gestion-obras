package com.reportes.client;

import com.reportes.dto.external.*;
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
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class ObrasClient {

    private final RestTemplate restTemplate;

    @Value("${servicios.obras.base-url}")
    private String baseUrl;

    private static final ParameterizedTypeReference<List<ObraExternalDto>> OBRAS_TYPE =
            new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<List<ObraCostoExternalDto>> COSTOS_TYPE =
            new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<List<TareaExternalDto>> TAREAS_TYPE =
            new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<List<EstadoPagoExternalDto>> ESTADOS_PAGO_TYPE =
            new ParameterizedTypeReference<>() {};

    public List<ObraExternalDto> obtenerObras() {
        try {
            ResponseEntity<List<ObraExternalDto>> response = restTemplate.exchange(
                    baseUrl + "/api/obras",
                    HttpMethod.GET,
                    null,
                    OBRAS_TYPE
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("No se pudieron obtener las obras: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public Optional<ObraExternalDto> obtenerObra(Long obraId) {
        try {
            ResponseEntity<ObraExternalDto> response = restTemplate.getForEntity(
                    baseUrl + "/api/obras/" + obraId,
                    ObraExternalDto.class
            );
            return Optional.ofNullable(response.getBody());
        } catch (RestClientException e) {
            log.warn("No se pudo obtener la obra {}: {}", obraId, e.getMessage());
            return Optional.empty();
        }
    }

    public List<ObraCostoExternalDto> obtenerCostos(Long obraId) {
        try {
            ResponseEntity<List<ObraCostoExternalDto>> response = restTemplate.exchange(
                    baseUrl + "/api/obras/costos/" + obraId,
                    HttpMethod.GET,
                    null,
                    COSTOS_TYPE
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("No se pudieron obtener los costos de la obra {}: {}", obraId, e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<TareaExternalDto> obtenerTareasDeObra(Long obraId) {
        try {
            ResponseEntity<List<TareaExternalDto>> response = restTemplate.exchange(
                    baseUrl + "/api/obras/tareas/" + obraId,
                    HttpMethod.GET,
                    null,
                    TAREAS_TYPE
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("No se pudieron obtener las tareas de la obra {}: {}", obraId, e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<TareaExternalDto> obtenerTareasPorProveedor(Long proveedorId) {
        try {
            ResponseEntity<List<TareaExternalDto>> response = restTemplate.exchange(
                    baseUrl + "/api/obras/tareas/proveedor/" + proveedorId,
                    HttpMethod.GET,
                    null,
                    TAREAS_TYPE
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("No se pudieron obtener las tareas del proveedor {}: {}", proveedorId, e.getMessage());
            return Collections.emptyList();
        }
    }

    public Optional<ProgresoExternalDto> obtenerProgreso(Long obraId) {
        try {
            ResponseEntity<ProgresoExternalDto> response = restTemplate.getForEntity(
                    baseUrl + "/api/obras/progreso/" + obraId,
                    ProgresoExternalDto.class
            );
            return Optional.ofNullable(response.getBody());
        } catch (RestClientException e) {
            log.warn("No se pudo obtener el progreso de la obra {}: {}", obraId, e.getMessage());
            return Optional.empty();
        }
    }

    public List<EstadoPagoExternalDto> obtenerEstadosPago() {
        try {
            ResponseEntity<List<EstadoPagoExternalDto>> response = restTemplate.exchange(
                    baseUrl + "/api/obras/estado_pago",
                    HttpMethod.GET,
                    null,
                    ESTADOS_PAGO_TYPE
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("No se pudieron obtener los estados de pago: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
