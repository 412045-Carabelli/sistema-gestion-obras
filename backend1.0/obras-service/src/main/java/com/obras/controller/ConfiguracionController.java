package com.obras.controller;

import com.obras.entity.AppConfig;
import com.obras.repository.AppConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/configuracion")
@RequiredArgsConstructor
public class ConfiguracionController {

    private final AppConfigRepository repository;

    @GetMapping
    public ResponseEntity<Map<String, String>> obtener(
            @RequestHeader(value = "X-Organizacion-Id", required = false) Long organizacionId) {
        Map<String, String> config = repository.findByOrganizacionId(organizacionId).stream()
            .collect(Collectors.toMap(
                AppConfig::getClave,
                c -> c.getValor() != null ? c.getValor() : ""
            ));
        return ResponseEntity.ok(config);
    }

    @PutMapping
    public ResponseEntity<Map<String, String>> actualizar(
            @RequestBody Map<String, String> valores,
            @RequestHeader(value = "X-Organizacion-Id", required = false) Long organizacionId) {
        valores.forEach((clave, valor) -> {
            AppConfig config = repository.findByClaveAndOrganizacionId(clave, organizacionId)
                .orElseGet(() -> {
                    AppConfig nuevo = new AppConfig();
                    nuevo.setClave(clave);
                    nuevo.setOrganizacionId(organizacionId);
                    return nuevo;
                });
            config.setValor(valor != null ? valor : "");
            config.setActualizadoEn(Instant.now());
            repository.save(config);
        });
        return obtener(organizacionId);
    }
}
