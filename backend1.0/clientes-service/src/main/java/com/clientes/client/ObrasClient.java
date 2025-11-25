package com.clientes.client;

import com.clientes.dto.ObraClienteResponse;
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
public class ObrasClient {

    private final RestTemplate restTemplate;

    @Value("${services.obras.url:http://obras-service:8081/api/obras}")
    private String obrasBaseUrl;

    public List<ObraClienteResponse> obtenerObrasPorCliente(Long clienteId) {
        try {
            String url = obrasBaseUrl + "?id_cliente=" + clienteId;
            ResponseEntity<List<ObraClienteResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<ObraClienteResponse>>() {
                    }
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException ex) {
            log.warn("No se pudieron obtener las obras del cliente {}: {}", clienteId, ex.getMessage());
            return Collections.emptyList();
        }
    }
}
