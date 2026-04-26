package com.common.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@Component
public class InstantConverter implements Converter<String, Instant> {

    @Override
    public Instant convert(String source) {
        if (source == null || source.isEmpty()) {
            return null;
        }

        try {
            // Si es un timestamp ISO 8601 completo (con Z o +00:00)
            if (source.contains("T")) {
                return Instant.parse(source);
            }
            // Si es solo una fecha (YYYY-MM-DD)
            else {
                LocalDate localDate = LocalDate.parse(source);
                return localDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("No se puede parsear la fecha: " + source, e);
        }
    }
}
