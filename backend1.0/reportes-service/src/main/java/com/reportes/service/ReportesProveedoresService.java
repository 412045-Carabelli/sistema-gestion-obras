package com.reportes.service;

import com.reportes.dto.response.ProveedorSaldoResponse;
import com.reportes.entity.ProveedorSaldo;
import com.reportes.repository.ProveedorSaldoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportesProveedoresService {
    private final ProveedorSaldoRepository repository;

    @Transactional(readOnly = true)
    public List<ProveedorSaldoResponse> obtenerSaldosProveedores() {
        log.info("Obteniendo saldos de proveedores desde SP");
        return repository.obtenerSaldosProveedores().stream()
                .map(this::mapearSaldo)
                .toList();
    }

    private ProveedorSaldoResponse mapearSaldo(ProveedorSaldo saldo) {
        return ProveedorSaldoResponse.builder()
                .id(saldo.getId())
                .nombre(saldo.getNombre())
                .totalCostos(saldo.getTotalCostos())
                .totalPagos(saldo.getTotalPagos())
                .saldoPendiente(saldo.getSaldoPendiente())
                .build();
    }
}
