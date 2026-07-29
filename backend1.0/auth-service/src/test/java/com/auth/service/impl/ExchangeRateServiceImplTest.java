package com.auth.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExchangeRateServiceImplTest {

    @Mock
    private RestTemplate restTemplate;

    private ExchangeRateServiceImpl service;

    @BeforeEach
    void setup() {
        service = new ExchangeRateServiceImpl(restTemplate);
        ReflectionTestUtils.setField(service, "providerUrl", "https://dolarapi.com/v1/dolares/oficial");
        ReflectionTestUtils.setField(service, "cacheTtlMinutes", 10L);
        ReflectionTestUtils.setField(service, "fallbackRateRaw", "");
    }

    @Test
    void getUsdToArsRate_devuelveElValorVenta() {
        when(restTemplate.getForObject(anyString(), any()))
                .thenReturn(new ExchangeRateServiceImpl.DolarApiResponse(new BigDecimal("1180.00"), new BigDecimal("1230.50")));

        BigDecimal rate = service.getUsdToArsRate();

        assertEquals(new BigDecimal("1230.50"), rate);
    }

    @Test
    void getUsdToArsRate_usaCacheYNoRepiteLaLlamadaDentroDelTtl() {
        when(restTemplate.getForObject(anyString(), any()))
                .thenReturn(new ExchangeRateServiceImpl.DolarApiResponse(new BigDecimal("1180.00"), new BigDecimal("1230.50")));

        service.getUsdToArsRate();
        service.getUsdToArsRate();
        service.getUsdToArsRate();

        verify(restTemplate, times(1)).getForObject(anyString(), any());
    }

    @Test
    void getUsdToArsRate_siFallaYNoHayCacheNiFallback_lanzaExcepcion() {
        when(restTemplate.getForObject(anyString(), any()))
                .thenThrow(new RuntimeException("dolarapi caído"));

        assertThrows(IllegalStateException.class, () -> service.getUsdToArsRate());
    }

    @Test
    void getUsdToArsRate_siFallaConCacheVigentePrevia_usaLaCacheVieja() {
        when(restTemplate.getForObject(anyString(), any()))
                .thenReturn(new ExchangeRateServiceImpl.DolarApiResponse(new BigDecimal("1180.00"), new BigDecimal("1230.50")));
        BigDecimal primeraVez = service.getUsdToArsRate();

        // Forzar vencimiento del cache
        ReflectionTestUtils.setField(service, "cacheTtlMinutes", 0L);
        when(restTemplate.getForObject(anyString(), any()))
                .thenThrow(new RuntimeException("dolarapi caído"));

        BigDecimal segundaVez = service.getUsdToArsRate();

        assertEquals(primeraVez, segundaVez);
    }

    @Test
    void getUsdToArsRate_siFallaYNoHayCacheConFallbackConfigurado_usaFallback() {
        ReflectionTestUtils.setField(service, "fallbackRateRaw", "1000.00");
        when(restTemplate.getForObject(anyString(), any()))
                .thenThrow(new RuntimeException("dolarapi caído"));

        BigDecimal rate = service.getUsdToArsRate();

        assertEquals(new BigDecimal("1000.00"), rate);
    }
}
