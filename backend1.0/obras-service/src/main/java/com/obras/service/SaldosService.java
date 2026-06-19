package com.obras.service;

import com.obras.dto.SaldoProveedorDTO;
import com.obras.dto.SaldoClienteDTO;
import java.util.List;

public interface SaldosService {
    /**
     * Obtiene saldos de todos los proveedores en 1 query (en lugar de N+1).
     * Ejecuta el SP sp_saldos_proveedores.
     */
    List<SaldoProveedorDTO> obtenerSaldosProveedores(Long organizacionId);

    List<SaldoClienteDTO> obtenerSaldosClientes(Long organizacionId);
}
