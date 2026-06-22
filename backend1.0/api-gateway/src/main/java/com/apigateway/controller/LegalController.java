package com.apigateway.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/legal")
@Slf4j
public class LegalController {

    @GetMapping("/terms")
    public ResponseEntity<Map<String, String>> getTermsOfService() {
        return ResponseEntity.ok(Map.of(
                "title", "Términos de Servicio",
                "version", "1.0",
                "lastUpdated", "2026-06-21",
                "url", "https://buildrr.cloud/terms"
        ));
    }

    @GetMapping("/privacy")
    public ResponseEntity<Map<String, String>> getPrivacyPolicy() {
        return ResponseEntity.ok(Map.of(
                "title", "Política de Privacidad",
                "version", "1.0",
                "lastUpdated", "2026-06-21",
                "url", "https://buildrr.cloud/privacy",
                "dataProtectionLaw", "Ley 25.326 de Protección de Datos Personales (Argentina)"
        ));
    }

    @GetMapping("/contact")
    public ResponseEntity<Map<String, String>> getLegalContact() {
        return ResponseEntity.ok(Map.of(
                "legal", "legal@buildrr.cloud",
                "privacy", "privacy@buildrr.cloud",
                "support", "support@buildrr.cloud",
                "country", "Argentina"
        ));
    }
}
