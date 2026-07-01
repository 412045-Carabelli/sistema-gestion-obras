package com.common.plan;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.function.LongSupplier;

/**
 * Utilidad que cada microservicio usa para validar límites y features del plan.
 *
 * Los límites y features llegan como Strings JSON extraídos de headers HTTP
 * inyectados por el API Gateway desde los claims del JWT:
 *   X-Plan-Codigo   → "BASICO"
 *   X-Plan-Limites  → {"maxObrasActivas":20,"maxClientes":100,...}
 *   X-Plan-Features → {"facturas":true,"agenda":true,...}
 *
 * Uso en controller:
 *   String limitesJson = request.getHeader("X-Plan-Limites");
 *   String featuresJson = request.getHeader("X-Plan-Features");
 *
 *   PlanLimitChecker.assertCanCreate(limitesJson, "obras", "maxObrasActivas",
 *       () -> obraRepo.countByOrganizacionIdAndActivoTrue(organizacionId));
 *
 *   PlanLimitChecker.assertFeatureEnabled(featuresJson, "facturas");
 */
@Slf4j
public class PlanLimitChecker {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private PlanLimitChecker() {}

    /**
     * Verifica que el conteo actual no supere el límite del plan.
     * Si el límite es null (Enterprise / sin límite), pasa siempre.
     *
     * @param limitesJson    valor del header X-Plan-Limites (JSON)
     * @param recurso        nombre legible del recurso (para mensaje de error)
     * @param limitKey       clave en el JSON de límites (ej: "maxObrasActivas")
     * @param contadorActual supplier que cuenta los registros actuales (lazy)
     */
    public static void assertCanCreate(
            String limitesJson,
            String recurso,
            String limitKey,
            LongSupplier contadorActual) {

        Integer limite = getLimite(limitesJson, limitKey);
        if (limite == null) return; // null = sin límite (Enterprise)

        long actual = contadorActual.getAsLong();
        if (actual >= limite) {
            throw new PlanLimitExceededException(recurso, limite, actual);
        }
    }

    /**
     * Verifica que el plan tenga habilitada una feature.
     *
     * @param featuresJson  valor del header X-Plan-Features (JSON)
     * @param feature       clave de la feature (ej: "facturas", "grupos_obras")
     */
    public static void assertFeatureEnabled(String featuresJson, String feature) {
        Map<String, Object> features = parseJson(featuresJson);
        if (features == null) {
            throw new FeatureNotAvailableException(feature);
        }
        Object value = features.get(feature);
        if (!Boolean.TRUE.equals(value)) {
            throw new FeatureNotAvailableException(feature);
        }
    }

    /**
     * Retorna el valor entero de un límite, o null si es ilimitado.
     * Retorna 0 si no hay header (sin plan = sin acceso).
     */
    public static Integer getLimite(String limitesJson, String limitKey) {
        Map<String, Object> limites = parseJson(limitesJson);
        if (limites == null) return 0; // sin header = plan FREE restrictivo

        Object value = limites.get(limitKey);
        if (value == null) return null; // null en JSON = sin límite
        if (value instanceof Number) return ((Number) value).intValue();
        return null;
    }

    private static Map<String, Object> parseJson(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return MAPPER.readValue(json, MAP_TYPE);
        } catch (Exception e) {
            log.warn("No se pudo parsear JSON de plan: {}", e.getMessage());
            return null;
        }
    }
}
