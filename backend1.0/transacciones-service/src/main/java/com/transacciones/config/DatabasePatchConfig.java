package com.transacciones.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabasePatchConfig {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void ensureIdCostoColumnRemoved() {
        try {
            jdbcTemplate.execute("ALTER TABLE transacciones DROP COLUMN IF EXISTS id_costo");
        } catch (Exception ex) {
            log.warn("No se pudo eliminar columna id_costo: {}", ex.getMessage());
        }
    }
}
