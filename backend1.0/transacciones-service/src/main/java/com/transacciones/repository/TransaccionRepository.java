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
    List<Transaccion> findByOrganizacionId(Long organizacionId);
    List<Transaccion> findByIdObra(Long obraId);
    List<Transaccion> findByIdObraAndActivoTrue(Long obraId);

    List<Transaccion> findByTipoAsociadoAndIdAsociado(String tipoAsociado, Long idAsociado);
    List<Transaccion> findByTipoAsociadoAndIdAsociadoAndActivoTrue(String tipoAsociado, Long idAsociado);

    List<Transaccion> findByIdObraAndTipoAsociadoAndIdAsociado(Long idObra, String tipoAsociado, Long idAsociado);


    @Query("SELECT COALESCE(SUM(t.monto), 0) FROM Transaccion t WHERE t.idObra = :idObra AND t.tipo_transaccion = com.transacciones.enums.TipoTransaccionEnum.COBRO AND UPPER(t.tipoAsociado) = 'CLIENTE'")
    Double sumarCobrosPorObra(@Param("idObra") Long idObra);

    @Transactional
    @Modifying
    @Query("UPDATE Transaccion t SET t.activo = false, t.bajaObra = true WHERE t.idObra = :obraId and t.activo = true")
    void softDeleteByObraId(@Param("obraId") Long obraId);

    @Transactional
    @Modifying
    @Query("UPDATE Transaccion t SET t.activo = true, t.bajaObra = false WHERE t.idObra = :obraId and t.activo = false and t.bajaObra = true")
    void activarPorObraId(@Param("obraId") Long obraId);

    @Query("SELECT t FROM Transaccion t WHERE t.activo = true ORDER BY t.fecha DESC")
    List<Transaccion> obtenerMovimientosActivos();

    @Query("SELECT t FROM Transaccion t WHERE t.activo = true AND t.organizacionId = :organizacionId ORDER BY t.fecha DESC")
    List<Transaccion> obtenerMovimientosActivosPorOrganizacion(@Param("organizacionId") Long organizacionId);

    @Query(nativeQuery = true, value =
        "SELECT COUNT(1) FROM transacciones t WHERE t.activo = 1 " +
        "AND (:idObra IS NULL OR t.id_obra = :idObra) " +
        "AND (:tipoAsociado IS NULL OR t.tipo_asociado = :tipoAsociado) " +
        "AND (:idAsociado IS NULL OR t.id_asociado = :idAsociado) " +
        "AND (:organizacionId = 0 OR t.organizacion_id = :organizacionId)"
    )
    long contarConFiltros(
        @Param("idObra") Long idObra,
        @Param("tipoAsociado") String tipoAsociado,
        @Param("idAsociado") Long idAsociado,
        @Param("organizacionId") Long organizacionId
    );
}
