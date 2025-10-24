package com.transacciones.repository;

import com.transacciones.entity.Transaccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransaccionRepository extends JpaRepository<Transaccion, Long> {
    List<Transaccion> findByIdObra(Long obraId);

    List<Transaccion> findByTipoAsociadoAndIdAsociado(String tipoAsociado, Long idAsociado);
}
