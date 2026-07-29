package com.common.plan;

/**
 * Lanzada cuando el plan activo no tiene acceso a una funcionalidad.
 * El handler debe retornar HTTP 402 Payment Required.
 */
public class FeatureNotAvailableException extends RuntimeException {

    private final String feature;

    public FeatureNotAvailableException(String feature) {
        super(String.format(
            "La funcionalidad '%s' no está disponible en tu plan actual. Actualizá tu plan para acceder.",
            feature
        ));
        this.feature = feature;
    }

    public String getFeature() { return feature; }
}
