package com.transacciones.repository;

import com.transacciones.dto.FlujoCajaDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
@Slf4j
public class FlujoCajaRepository {

    @PersistenceContext
    private EntityManager entityManager;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${services.obras.url:http://localhost:8081/api/obras}")
    private String obrasServiceUrl;

    /**
     * Obtiene el flujo de caja principal.
     * Filtra obras por 6 estados: Adjudicada, En progreso, Cobrada, Facturada, Facturada parcial, Finalizada
     * Los cálculos se hacen en Java para evitar problemas de cross-database queries
     *
     * @return FlujoCajaDTO con: cobrado, por_cobrar, pagado, por_pagar, resultado
     */
    public FlujoCajaDTO obtenerFlujoCajaPrincipal() {
        try {
            // 1. Obtener presupuesto total y costos desde sgo_obras
            BigDecimal presupuestoTotal = obtenerPresupuestoTotal();
            BigDecimal costosTotal = obtenerCostosTotal();

            // 2. Obtener transacciones COBRO (en sgo_transacciones)
            BigDecimal cobrado = obtenerCobrado();

            // 3. Obtener transacciones PAGO (en sgo_transacciones)
            BigDecimal pagado = obtenerPagado();

            // 4. Calcular derivados
            BigDecimal porCobrar = presupuestoTotal.subtract(cobrado);
            if (porCobrar.compareTo(BigDecimal.ZERO) < 0) {
                porCobrar = BigDecimal.ZERO;
            }

            BigDecimal porPagar = costosTotal.subtract(pagado);
            if (porPagar.compareTo(BigDecimal.ZERO) < 0) {
                porPagar = BigDecimal.ZERO;
            }

            BigDecimal resultado = cobrado.subtract(pagado);

            FlujoCajaDTO dto = FlujoCajaDTO.builder()
                    .cobrado(cobrado)
                    .por_cobrar(porCobrar)
                    .pagado(pagado)
                    .por_pagar(porPagar)
                    .resultado(resultado)
                    .presupuesto_total(presupuestoTotal)
                    .costos_total(costosTotal)
                    .build();

            log.info("Flujo de caja calculado: cobrado={}, pagado={}, resultado={}",
                    cobrado, pagado, resultado);
            return dto;

        } catch (Exception e) {
            log.error("Error fatal en obtenerFlujoCajaPrincipal", e);
            // Devolver estructura válida aunque esté vacía, no lanzar excepción
            return FlujoCajaDTO.builder()
                    .cobrado(BigDecimal.ZERO)
                    .por_cobrar(BigDecimal.ZERO)
                    .pagado(BigDecimal.ZERO)
                    .por_pagar(BigDecimal.ZERO)
                    .resultado(BigDecimal.ZERO)
                    .presupuesto_total(BigDecimal.ZERO)
                    .costos_total(BigDecimal.ZERO)
                    .build();
        }
    }

    private BigDecimal obtenerPresupuestoTotal() {
        try {
            // Llamar a API de obras-service para obtener el dato
            String url = obrasServiceUrl.replaceAll("/api/obras$", "") + "/api/saldos/flujo-caja/presupuesto";
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("presupuesto_total")) {
                return toBigDecimal(response.get("presupuesto_total"));
            }
            return BigDecimal.ZERO;
        } catch (Exception e) {
            log.warn("Error en obtenerPresupuestoTotal: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal obtenerCostosTotal() {
        try {
            // Llamar a API de obras-service para obtener el dato
            String url = obrasServiceUrl.replaceAll("/api/obras$", "") + "/api/saldos/flujo-caja/costos";
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("costos_total")) {
                return toBigDecimal(response.get("costos_total"));
            }
            return BigDecimal.ZERO;
        } catch (Exception e) {
            log.warn("Error en obtenerCostosTotal: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal obtenerCobrado() {
        try {
            // Filtrar solo obras en 6 estados: ADJUDICADA, EN_PROGRESO, COBRADA, FACTURADA, FACTURADA_PARCIAL, FINALIZADA
            Object result = entityManager
                    .createNativeQuery(
                            "SELECT ISNULL(SUM(CAST(t.monto AS DECIMAL(14, 2))), 0) FROM transacciones t " +
                            "INNER JOIN tipo_transaccion tt ON t.id_tipo_transaccion = CAST(tt.id AS VARCHAR(50)) " +
                            "INNER JOIN sgo_obras.dbo.obras o ON t.id_obra = o.id " +
                            "WHERE t.activo = 1 " +
                            "  AND tt.nombre = 'COBRO' " +
                            "  AND o.estado_obra IN ('ADJUDICADA', 'EN_PROGRESO', 'COBRADA', 'FACTURADA', 'FACTURADA_PARCIAL', 'FINALIZADA')"
                    )
                    .getSingleResult();
            BigDecimal cobrado = toBigDecimal(result);
            log.info("Cobrado obtenido (filtrado por estado): {}", cobrado);
            return cobrado;
        } catch (Exception e) {
            log.error("Error en obtenerCobrado: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal obtenerPagado() {
        try {
            // Filtrar solo obras en 6 estados: ADJUDICADA, EN_PROGRESO, COBRADA, FACTURADA, FACTURADA_PARCIAL, FINALIZADA
            Object result = entityManager
                    .createNativeQuery(
                            "SELECT ISNULL(SUM(CAST(t.monto AS DECIMAL(14, 2))), 0) FROM transacciones t " +
                            "INNER JOIN tipo_transaccion tt ON t.id_tipo_transaccion = CAST(tt.id AS VARCHAR(50)) " +
                            "INNER JOIN sgo_obras.dbo.obras o ON t.id_obra = o.id " +
                            "WHERE t.activo = 1 " +
                            "  AND tt.nombre = 'PAGO' " +
                            "  AND o.estado_obra IN ('ADJUDICADA', 'EN_PROGRESO', 'COBRADA', 'FACTURADA', 'FACTURADA_PARCIAL', 'FINALIZADA')"
                    )
                    .getSingleResult();
            BigDecimal pagado = toBigDecimal(result);
            log.info("Pagado obtenido (filtrado por estado): {}", pagado);
            return pagado;
        } catch (Exception e) {
            log.error("Error en obtenerPagado: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal) {
            return (BigDecimal) value;
        }
        if (value instanceof Double) {
            return BigDecimal.valueOf((Double) value);
        }
        if (value instanceof Integer) {
            return BigDecimal.valueOf(((Integer) value).longValue());
        }
        if (value instanceof Long) {
            return BigDecimal.valueOf((Long) value);
        }
        return BigDecimal.ZERO;
    }
}
