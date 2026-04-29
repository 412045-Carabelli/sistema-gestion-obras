package com.obras.service.impl;

import com.obras.service.SaldosService;
import com.obras.dto.SaldoProveedorDTO;
import com.obras.dto.SaldoClienteDTO;
import com.obras.repository.SaldosProveedoresRepository;
import com.obras.repository.SaldosClientesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SaldosServiceImpl implements SaldosService {

    private final SaldosProveedoresRepository saldosProveedoresRepository;
    private final SaldosClientesRepository saldosClientesRepository;

    /**
     * Ejecuta el SP sp_saldos_proveedores en la BD.
     * Devuelve saldos de TODOS los proveedores en 1 sola query.
     *
     * @return Lista de saldos por proveedor (id, nombre, total_costos, total_pagos, saldo_pendiente)
     */
    @Override
    public List<SaldoProveedorDTO> obtenerSaldosProveedores() {
        try {
            return saldosProveedoresRepository.obtenerSaldosOptimizado();
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }

    /**
     * Ejecuta el SP sp_saldos_clientes en la BD.
     * Devuelve saldos de TODOS los clientes en 1 sola query.
     *
     * @return Lista de saldos por cliente (id, nombre, total_presupuesto, total_cobros, saldo_pendiente)
     */
    @Override
    public List<SaldoClienteDTO> obtenerSaldosClientes() {
        try {
            return saldosClientesRepository.obtenerSaldosOptimizado();
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }
}
