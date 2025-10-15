package com.transacciones.repository;

import com.transacciones.entity.TipoTransaccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoTransaccionRepository extends JpaRepository<TipoTransaccion, Long> {
}
