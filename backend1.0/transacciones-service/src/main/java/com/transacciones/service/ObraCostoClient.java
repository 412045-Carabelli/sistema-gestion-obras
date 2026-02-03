package com.transacciones.service;

import com.transacciones.dto.ObraCostoDto;
import com.transacciones.dto.ObraResumenDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ObraCostoClient {

    private final RestTemplate restTemplate;

    @Value("${services.obras.url}")
    private String obrasServiceUrl;

    public ObraResumenDto obtenerObra(Long idObra) {
        if (idObra == null) return null;
        String url = String.format("%s/%s", obrasServiceUrl, idObra);
        return restTemplate.getForObject(url, ObraResumenDto.class);
    }

    public List<ObraCostoDto> obtenerCostos(Long idObra) {
        if (idObra == null) return List.of();
        String url = String.format("%s/costos/%s", obrasServiceUrl, idObra);
        ObraCostoDto[] response = restTemplate.getForObject(url, ObraCostoDto[].class);
        if (response == null) return List.of();
        return Arrays.asList(response);
    }
}
