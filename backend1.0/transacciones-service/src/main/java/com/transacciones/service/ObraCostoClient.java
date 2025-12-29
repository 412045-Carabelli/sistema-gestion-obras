package com.transacciones.service;

import com.transacciones.dto.ObraCostoDto;
import com.transacciones.dto.ObraResumenDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;

@Service
@RequiredArgsConstructor
public class ObraCostoClient {

    private final RestTemplate restTemplate;

    @Value("${services.obras.url}")
    private String obrasServiceUrl;

    public ObraCostoDto obtenerCosto(Long idObra, Long idCosto) {
        if (idObra == null || idCosto == null) return null;
        String url = String.format("%s/costos/%s", obrasServiceUrl, idObra);
        ObraCostoDto[] costos = restTemplate.getForObject(url, ObraCostoDto[].class);
        if (costos == null) return null;
        return Arrays.stream(costos)
                .filter(c -> idCosto.equals(c.getId()))
                .findFirst()
                .orElse(null);
    }

    public ObraResumenDto obtenerObra(Long idObra) {
        if (idObra == null) return null;
        String url = String.format("%s/%s", obrasServiceUrl, idObra);
        return restTemplate.getForObject(url, ObraResumenDto.class);
    }

    public void actualizarEstadoPago(Long idCosto, String estado) {
        if (idCosto == null || estado == null) return;
        String url = String.format("%s/costos/%s/estado/%s", obrasServiceUrl, idCosto, estado);
        restTemplate.put(url, null);
    }
}
