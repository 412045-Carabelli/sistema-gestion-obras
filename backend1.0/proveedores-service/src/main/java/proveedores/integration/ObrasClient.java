package proveedores.integration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class ObrasClient {

    private final RestTemplate restTemplate;

    @Value("${obras.service.url:http://localhost:8080}")
    private String obrasServiceUrl;

    public Optional<String> obtenerNombreObra(Long obraId) {
        String url = String.format("%s/api/obras/%d", obrasServiceUrl, obraId);
        try {
            ResponseEntity<ObraResponse> response = restTemplate.getForEntity(url, ObraResponse.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return Optional.ofNullable(response.getBody().nombre);
            }
        } catch (RestClientException ex) {
            log.warn("Fallo al consultar obra {}: {}", obraId, ex.getMessage());
        }
        return Optional.empty();
    }

    public List<ObraResumenResponse> obtenerObras() {
        String url = String.format("%s/api/obras", obrasServiceUrl);
        try {
            ResponseEntity<List<ObraResumenResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<ObraResumenResponse>>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException ex) {
            log.warn("Fallo al consultar obras: {}", ex.getMessage());
        }
        return Collections.emptyList();
    }

    public List<ObraCostoResponse> obtenerCostos(Long obraId) {
        String url = String.format("%s/api/obras/costos/%d", obrasServiceUrl, obraId);
        try {
            ResponseEntity<List<ObraCostoResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<ObraCostoResponse>>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException ex) {
            log.warn("Fallo al consultar costos de obra {}: {}", obraId, ex.getMessage());
        }
        return Collections.emptyList();
    }

    public boolean obraGeneraDeuda(String estadoRaw) {
        String estado = normalizarEstado(estadoRaw);
        if (estado.isEmpty()) return true;
        return !ESTADOS_SIN_DEUDA.contains(estado);
    }

    public BigDecimal costoBase(ObraCostoResponse costo) {
        if (costo == null) return BigDecimal.ZERO;
        if (costo.subtotal() != null) return costo.subtotal();
        if (costo.cantidad() != null && costo.precio_unitario() != null) {
            return costo.cantidad().multiply(costo.precio_unitario());
        }
        return costo.total() != null ? costo.total() : BigDecimal.ZERO;
    }

    private String normalizarEstado(String raw) {
        if (raw == null || raw.isBlank()) return "";
        String sinTildes = Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
        return sinTildes.toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
    }

    public record ObraResponse(Long id, String nombre) { }

    public record ObraResumenResponse(Long id, String obra_estado, Boolean activo) { }

    public record ObraCostoResponse(
            Long id,
            Long id_obra,
            Long id_proveedor,
            BigDecimal cantidad,
            BigDecimal precio_unitario,
            BigDecimal subtotal,
            BigDecimal total,
            Boolean activo
    ) { }

    private static final java.util.Set<String> ESTADOS_SIN_DEUDA = java.util.Set.of(
            "PRESUPUESTADA",
            "PERDIDA",
            "COTIZADA"
    );
}
