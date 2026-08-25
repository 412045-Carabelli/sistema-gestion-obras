package com.reportes.client;

import com.reportes.dto.external.DashboardCuentaCorrienteExternalDto;
import com.reportes.dto.external.MovimientosPeriodoPageExternalDto;
import com.reportes.dto.external.TopObraFinancieroExternalDto;
import com.reportes.dto.external.TransaccionExternalDto;
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
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
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

    private static final ParameterizedTypeReference<List<TopObraFinancieroExternalDto>> TOP_OBRAS_TYPE =
            new ParameterizedTypeReference<>() {};

    public List<TransaccionExternalDto> obtenerTransacciones() {
        try {
            ResponseEntity<List<TransaccionExternalDto>> response = restTemplate.exchange(
                    baseUrl + "/api/transacciones/activas",
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

    public List<TopObraFinancieroExternalDto> obtenerTopObras(int topN, Long organizacionId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            if (organizacionId != null && organizacionId > 0) {
                headers.set("X-Organizacion-Id", String.valueOf(organizacionId));
            }
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<List<TopObraFinancieroExternalDto>> response = restTemplate.exchange(
                    baseUrl + "/api/transacciones/dashboard/graficos?topN=" + topN,
                    HttpMethod.GET,
                    entity,
                    TOP_OBRAS_TYPE
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("No se pudieron obtener las top obras financiero: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public MovimientosPeriodoPageExternalDto obtenerMovimientosPeriodo(
            Long idObra, Long clienteId, Long proveedorId, LocalDate fechaInicio, LocalDate fechaFin,
            int page, int size, Long organizacionId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            if (organizacionId != null && organizacionId > 0) {
                headers.set("X-Organizacion-Id", String.valueOf(organizacionId));
            }
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            String tipoAsociado = clienteId != null ? "CLIENTE" : (proveedorId != null ? "PROVEEDOR" : null);
            Long idAsociado = clienteId != null ? clienteId : proveedorId;

            String uri = UriComponentsBuilder.fromHttpUrl(baseUrl + "/api/transacciones/con-asociados")
                    .queryParam("page", page)
                    .queryParam("size", size)
                    .queryParamIfPresent("idObra", java.util.Optional.ofNullable(idObra))
                    .queryParamIfPresent("tipoAsociado", java.util.Optional.ofNullable(tipoAsociado))
                    .queryParamIfPresent("idAsociado", java.util.Optional.ofNullable(idAsociado))
                    .queryParamIfPresent("fechaInicio", java.util.Optional.ofNullable(fechaInicio))
                    .queryParamIfPresent("fechaFin", java.util.Optional.ofNullable(fechaFin))
                    .toUriString();

            ResponseEntity<MovimientosPeriodoPageExternalDto> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    entity,
                    MovimientosPeriodoPageExternalDto.class
            );
            return response.getBody() != null ? response.getBody() : new MovimientosPeriodoPageExternalDto();
        } catch (RestClientException e) {
            log.warn("No se pudieron obtener los movimientos del período: {}", e.getMessage());
            return new MovimientosPeriodoPageExternalDto();
        }
    }

    public DashboardCuentaCorrienteExternalDto obtenerCuentaCorriente(
            Long obraId, Long clienteId, Long proveedorId, LocalDate fechaInicio, LocalDate fechaFin,
            Long organizacionId, List<String> estados) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            if (organizacionId != null && organizacionId > 0) {
                headers.set("X-Organizacion-Id", String.valueOf(organizacionId));
            }
            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("obraId", obraId);
            body.put("clienteId", clienteId);
            body.put("proveedorId", proveedorId);
            body.put("fechaInicio", fechaInicio);
            body.put("fechaFin", fechaFin);
            body.put("estados", estados);
            HttpEntity<java.util.Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<DashboardCuentaCorrienteExternalDto> response = restTemplate.exchange(
                    baseUrl + "/api/transacciones/dashboard/cuenta-corriente",
                    HttpMethod.POST,
                    entity,
                    DashboardCuentaCorrienteExternalDto.class
            );
            return response.getBody() != null ? response.getBody() : new DashboardCuentaCorrienteExternalDto();
        } catch (RestClientException e) {
            log.warn("No se pudo obtener la cuenta corriente del dashboard: {}", e.getMessage());
            return new DashboardCuentaCorrienteExternalDto();
        }
    }
}
