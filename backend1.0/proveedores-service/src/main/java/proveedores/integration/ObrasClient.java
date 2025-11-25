package proveedores.integration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

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
                return Optional.ofNullable(response.getBody().getNombre());
            }
        } catch (RestClientException ex) {
            log.warn("Fallo al consultar obra {}: {}", obraId, ex.getMessage());
        }
        return Optional.empty();
    }

    public record ObraResponse(Long id, String nombre) { }
}
