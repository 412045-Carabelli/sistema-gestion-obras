package com.transacciones.repository;

import com.transacciones.dto.TransaccionConAsociadoDto;
import com.transacciones.enums.TipoTransaccionEnum;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


/**
 * Repository que ejecuta sp_transacciones_con_asociados_paginado.
 * Reemplaza los N+1 HTTP calls del TransaccionService con un solo JOIN cross-DB.
 */
@Repository
@Slf4j
public class TransaccionConAsociadoRepository {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Ejecuta el SP y retorna un mapa con "content" (lista de DTOs) y metadatos de paginación.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> listarConAsociadosPaginado(int page, int size, Long idObra, String tipoAsociado, Long idAsociado) {
        try {
            Query query = entityManager.createNativeQuery(
                "DECLARE @page INT = ?1; " +
                "DECLARE @size INT = ?2; " +
                "DECLARE @idObra BIGINT = ?3; " +
                "DECLARE @tipoAsociado NVARCHAR(50) = ?4; " +
                "DECLARE @idAsociado BIGINT = ?5; " +
                "EXEC sp_transacciones_con_asociados_paginado @page, @size, @idObra, @tipoAsociado, @idAsociado"
            );
            query.setParameter(1, page);
            query.setParameter(2, size);
            query.setParameter(3, idObra);
            query.setParameter(4, tipoAsociado);
            query.setParameter(5, idAsociado);

            List<Object[]> rows = query.getResultList();

            // El SP retorna 2 result sets: [0] = totalElements (scalar), resto = filas de datos.
            // Con JPA getResultList() solo obtenemos el primero (el SELECT de datos).
            // Ejecutamos count por separado para la paginación.
            long total = contarTransacciones(idObra, tipoAsociado, idAsociado);

            List<TransaccionConAsociadoDto> content = new ArrayList<>();
            for (Object[] row : rows) {
                content.add(mapRow(row));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("content", content);
            response.put("totalElements", total);
            response.put("totalPages", (int) Math.ceil((double) total / size));
            response.put("currentPage", page);
            response.put("pageSize", size);
            response.put("isFirst", page == 0);
            response.put("isLast", (long) (page + 1) * size >= total);
            return response;

        } catch (Exception e) {
            log.error("Error ejecutando sp_transacciones_con_asociados_paginado", e);
            throw e;
        }
    }

    private long contarTransacciones(Long idObra, String tipoAsociado, Long idAsociado) {
        Query q = entityManager.createNativeQuery(
            "SELECT COUNT(1) FROM [sgo_transacciones].[dbo].[transacciones] t " +
            "WHERE t.activo = 1 " +
            "AND (:idObra IS NULL OR t.id_obra = :idObra) " +
            "AND (:tipoAsociado IS NULL OR t.tipo_asociado = :tipoAsociado) " +
            "AND (:idAsociado IS NULL OR t.id_asociado = :idAsociado)"
        );
        q.setParameter("idObra", idObra);
        q.setParameter("tipoAsociado", tipoAsociado);
        q.setParameter("idAsociado", idAsociado);
        Number result = (Number) q.getSingleResult();
        return result.longValue();
    }

    private TransaccionConAsociadoDto mapRow(Object[] row) {
        // Columnas SP: id, id_obra, nombre_obra, tipo_asociado, id_asociado, nombre_asociado,
        //              id_tipo_transaccion, tipo_transaccion, fecha, monto, forma_pago,
        //              medio_pago, concepto, factura_cobrada, activo, ultima_actualizacion, tipo_actualizacion
        int i = 0;
        Long id           = row[i] != null ? ((Number) row[i++]).longValue() : null; if (row.length <= ++i-1) i--;
        Long idObra       = row[1] != null ? ((Number) row[1]).longValue() : null;
        String nombreObra = (String) row[2];
        String tipoAsoc   = (String) row[3];
        Long idAsoc       = row[4] != null ? ((Number) row[4]).longValue() : null;
        String nombreAsoc = (String) row[5];
        String tipoTxStr  = (String) row[6]; // id_tipo_transaccion = EnumType.STRING → "COBRO"/"PAGO"
        LocalDate fecha   = row[8] != null ? ((java.sql.Date) row[8]).toLocalDate() : null;
        Double monto      = row[9] != null ? ((Number) row[9]).doubleValue() : null;
        String formaPago  = (String) row[10];
        String medioPago  = (String) row[11];
        String concepto   = (String) row[12];
        Boolean factura   = row[13] != null && (row[13] instanceof Boolean ? (Boolean) row[13] : ((Number) row[13]).intValue() == 1);
        Boolean activo    = row[14] != null && (row[14] instanceof Boolean ? (Boolean) row[14] : ((Number) row[14]).intValue() == 1);

        TipoTransaccionEnum tipoTx = null;
        if (tipoTxStr != null) {
            try { tipoTx = TipoTransaccionEnum.valueOf(tipoTxStr); } catch (Exception ignored) {}
        }

        return TransaccionConAsociadoDto.builder()
                .id(((Number) row[0]).longValue())
                .id_obra(idObra)
                .nombre_obra(nombreObra)
                .tipo_asociado(tipoAsoc)
                .id_asociado(idAsoc)
                .nombre_asociado(nombreAsoc)
                .tipo_transaccion(tipoTx)
                .fecha(fecha)
                .monto(monto)
                .forma_pago(formaPago)
                .medio_pago(medioPago)
                .concepto(concepto)
                .factura_cobrada(factura)
                .activo(activo)
                .build();
    }
}
