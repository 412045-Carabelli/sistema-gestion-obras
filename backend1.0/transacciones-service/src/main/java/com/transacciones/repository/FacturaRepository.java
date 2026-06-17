package com.transacciones.repository;

import com.transacciones.entity.Factura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacturaRepository extends JpaRepository<Factura, Long> {
    List<Factura> findByIdCliente(Long idCliente);
    List<Factura> findByIdObra(Long idObra);
    List<Factura> findByEmpresaId(Long empresaId);
    List<Factura> findByIdClienteAndEmpresaId(Long idCliente, Long empresaId);
    List<Factura> findByIdObraAndEmpresaId(Long idObra, Long empresaId);
}
