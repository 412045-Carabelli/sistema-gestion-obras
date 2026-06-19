package com.obras.repository;

import com.obras.dto.SaldoProveedorDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.List;

@Repository
@Slf4j
public class SaldosProveedoresRepository {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Ejecuta el SP sp_saldos_proveedores y mapea los resultados a DTO.
     * Devuelve saldos de TODOS los proveedores en 1 sola query (en lugar de N+1).
     *
     * Resultado: [id, nombre, total_costos, total_pagos, saldo_pendiente]
     */
    public List<SaldoProveedorDTO> obtenerSaldosOptimizado(Long organizacionId) {
        try {
            Query query = entityManager.createNativeQuery("EXEC sp_saldos_proveedores ?");
            query.setParameter(1, organizacionId);

            @SuppressWarnings("unchecked")
            List<Object[]> resultados = query.getResultList();

            return resultados.stream()
                    .map(row -> new SaldoProveedorDTO(
                            ((Number) row[0]).longValue(),           // id
                            (String) row[1],                         // nombre
                            ((Number) row[2]).doubleValue(),         // total_costos
                            ((Number) row[3]).doubleValue(),         // total_pagos
                            ((Number) row[4]).doubleValue()          // saldo_pendiente
                    ))
                    .toList();
        } catch (Exception ex) {
            log.error("Error ejecutando SP sp_saldos_proveedores", ex);
            return Collections.emptyList();
        }
    }
}
