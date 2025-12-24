package com.transacciones.repository;

import com.transacciones.entity.Factura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacturaRepository extends JpaRepository<Factura, Long> {
    List<Factura> findByIdCliente(Long idCliente);
    List<Factura> findByIdObra(Long idObra);
}
