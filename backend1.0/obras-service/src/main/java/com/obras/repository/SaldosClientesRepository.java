package com.obras.repository;

import com.obras.dto.SaldoClienteDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.List;

@Repository
@Slf4j
public class SaldosClientesRepository {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Ejecuta el SP sp_saldos_clientes y mapea los resultados a DTO.
     * Devuelve saldos de TODOS los clientes en 1 sola query (en lugar de 2M llamadas HTTP).
     *
     * Resultado: [id, nombre, total_presupuesto, total_cobros, saldo_pendiente]
     */
    public List<SaldoClienteDTO> obtenerSaldosOptimizado(Long organizacionId) {
        try {
            Query query = entityManager.createNativeQuery("EXEC sp_saldos_clientes ?");
            query.setParameter(1, organizacionId);

            @SuppressWarnings("unchecked")
            List<Object[]> resultados = query.getResultList();

            return resultados.stream()
                    .map(row -> new SaldoClienteDTO(
                            ((Number) row[0]).longValue(),           // id
                            (String) row[1],                         // nombre
                            ((Number) row[2]).doubleValue(),         // total_presupuesto
                            ((Number) row[3]).doubleValue(),         // total_cobros
                            ((Number) row[4]).doubleValue()          // saldo_pendiente
                    ))
                    .toList();
        } catch (Exception ex) {
            log.error("Error ejecutando SP sp_saldos_clientes", ex);
            return Collections.emptyList();
        }
    }
}
