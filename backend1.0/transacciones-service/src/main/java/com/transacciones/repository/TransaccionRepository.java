package com.transacciones.repository;

import com.transacciones.entity.Transaccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface TransaccionRepository extends JpaRepository<Transaccion, Long> {
    List<Transaccion> findByIdObra(Long obraId);

    List<Transaccion> findByTipoAsociadoAndIdAsociado(String tipoAsociado, Long idAsociado);

    void deleteByIdCosto(Long idCosto);

    @Query("SELECT COALESCE(SUM(t.monto), 0) FROM Transaccion t WHERE t.idCosto = :idCosto AND t.tipo_transaccion = com.transacciones.enums.TipoTransaccionEnum.PAGO")
    Double sumarPagosPorCosto(@Param("idCosto") Long idCosto);

    @Transactional
    @Modifying
    @Query("UPDATE Transaccion t SET t.activo = false WHERE t.idObra = :obraId")
    void softDeleteByObraId(Long obraId);
}
