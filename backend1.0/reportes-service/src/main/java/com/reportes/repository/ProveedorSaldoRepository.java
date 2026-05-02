package com.reportes.repository;

import com.reportes.entity.ProveedorSaldo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProveedorSaldoRepository extends JpaRepository<ProveedorSaldo, Long> {
    @Query(value = "SELECT * FROM vw_saldos_proveedores ORDER BY nombre ASC", nativeQuery = true)
    List<ProveedorSaldo> obtenerSaldosProveedores();
}
