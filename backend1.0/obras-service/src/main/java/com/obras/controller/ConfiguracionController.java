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
    public ResponseEntity<Map<String, String>> obtener() {
        Map<String, String> config = repository.findAll().stream()
            .collect(Collectors.toMap(
                AppConfig::getClave,
                c -> c.getValor() != null ? c.getValor() : ""
            ));
        return ResponseEntity.ok(config);
    }

    @PutMapping
    public ResponseEntity<Map<String, String>> actualizar(@RequestBody Map<String, String> valores) {
        valores.forEach((clave, valor) ->
            repository.findById(clave).ifPresent(config -> {
                config.setValor(valor != null ? valor : "");
                config.setActualizadoEn(Instant.now());
                repository.save(config);
            })
        );
        return obtener();
    }
}
