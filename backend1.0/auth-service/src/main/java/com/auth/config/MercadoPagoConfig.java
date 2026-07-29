package com.auth.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class MercadoPagoConfig {

    @Value("${mp.access-token:}")
    private String accessToken;

    @PostConstruct
    public void init() {
        if (accessToken == null || accessToken.isBlank()) {
            log.warn("MP_ACCESS_TOKEN no configurado — integracion MP deshabilitada");
            return;
        }
        com.mercadopago.MercadoPagoConfig.setAccessToken(accessToken);
        log.info("Mercado Pago SDK inicializado (token={}...)", accessToken.substring(0, Math.min(12, accessToken.length())));
    }
}
