package com.auth.service.impl;

import com.auth.service.ExchangeRateService;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateServiceImpl implements ExchangeRateService {

    private final RestTemplate restTemplate;

    @Value("${exchange-rate.provider-url}")
    private String providerUrl;

    @Value("${exchange-rate.cache-ttl-minutes:10}")
    private long cacheTtlMinutes;

    @Value("${exchange-rate.fallback-rate:}")
    private String fallbackRateRaw;

    private final AtomicReference<CachedRate> cache = new AtomicReference<>();

    @Override
    public BigDecimal getUsdToArsRate() {
        CachedRate cached = cache.get();
        if (cached != null && cached.obtenidoEn().plusSeconds(cacheTtlMinutes * 60).isAfter(Instant.now())) {
            return cached.valor();
        }

        try {
            DolarApiResponse response = restTemplate.getForObject(providerUrl, DolarApiResponse.class);
            if (response == null || response.venta() == null) {
                throw new IllegalStateException("Respuesta vacía del proveedor de cotización");
            }
            BigDecimal valor = response.venta();
            cache.set(new CachedRate(valor, Instant.now()));
            return valor;
        } catch (Exception e) {
            log.warn("No se pudo obtener cotización USD/ARS de {}: {}", providerUrl, e.getMessage());
            if (cached != null) {
                log.warn("Usando cotización cacheada vencida ({}) por fallo del proveedor", cached.valor());
                return cached.valor();
            }
            BigDecimal fallback = parseFallback();
            if (fallback != null) {
                log.warn("Usando cotización fallback configurada: {}", fallback);
                return fallback;
            }
            throw new IllegalStateException("No se pudo obtener la cotización USD/ARS y no hay fallback configurado", e);
        }
    }

    private BigDecimal parseFallback() {
        if (fallbackRateRaw == null || fallbackRateRaw.isBlank()) return null;
        try {
            return new BigDecimal(fallbackRateRaw.trim());
        } catch (NumberFormatException e) {
            log.error("exchange-rate.fallback-rate mal formateado: {}", fallbackRateRaw);
            return null;
        }
    }

    private record CachedRate(BigDecimal valor, Instant obtenidoEn) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record DolarApiResponse(BigDecimal compra, BigDecimal venta) {}
}
