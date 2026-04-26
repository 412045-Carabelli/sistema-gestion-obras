package com.obras.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @Query("""
        SELECT a FROM AuditLog a
        WHERE (:modulo IS NULL OR LOWER(a.modulo) LIKE LOWER(CONCAT('%', :modulo, '%')))
          AND (:tipo IS NULL OR a.tipoRequest = :tipo)
          AND (:creador IS NULL OR LOWER(a.usuario) LIKE LOWER(CONCAT('%', :creador, '%')))
          AND (:endpoint IS NULL OR LOWER(a.endpoint) LIKE LOWER(CONCAT('%', :endpoint, '%')))
          AND (:tabla IS NULL OR LOWER(a.tablaModificada) LIKE LOWER(CONCAT('%', :tabla, '%')))
          AND (:codigo IS NULL OR a.codigoRespuesta = :codigo)
          AND (:desde IS NULL OR a.fechaHora >= :desde)
          AND (:hasta IS NULL OR a.fechaHora <= :hasta)
        ORDER BY a.fechaHora DESC
    """)
    List<AuditLog> search(
        @Param("modulo") String modulo,
        @Param("tipo") String tipo,
        @Param("creador") String creador,
        @Param("endpoint") String endpoint,
        @Param("tabla") String tabla,
        @Param("codigo") Integer codigo,
        @Param("desde") Instant desde,
        @Param("hasta") Instant hasta
    );
}
