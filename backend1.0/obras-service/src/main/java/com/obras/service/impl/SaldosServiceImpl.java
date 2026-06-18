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
    public List<SaldoProveedorDTO> obtenerSaldosProveedores(Long organizacionId) {
        try {
            return saldosProveedoresRepository.obtenerSaldosOptimizado(organizacionId);
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }

    @Override
    public List<SaldoClienteDTO> obtenerSaldosClientes(Long organizacionId) {
        try {
            return saldosClientesRepository.obtenerSaldosOptimizado(organizacionId);
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }
}
