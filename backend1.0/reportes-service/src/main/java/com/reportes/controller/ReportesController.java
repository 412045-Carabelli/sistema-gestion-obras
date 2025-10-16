package com.reportes.controller;

import com.reportes.dto.ReporteDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReportesController {

    @GetMapping
    public ResponseEntity<ReporteDto> test() {
        return ResponseEntity.ok(new ReporteDto(1L));
    }

}
