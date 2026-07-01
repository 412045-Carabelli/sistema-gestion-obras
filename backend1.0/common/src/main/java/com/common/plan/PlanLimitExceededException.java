package com.common.plan;

/**
 * Lanzada cuando una operación supera el límite del plan activo.
 * El handler debe retornar HTTP 402 Payment Required.
 */
public class PlanLimitExceededException extends RuntimeException {

    private final String recurso;     // "obras", "clientes", "proveedores", "transacciones"
    private final int limiteActual;
    private final long cantidadActual;

    public PlanLimitExceededException(String recurso, int limiteActual, long cantidadActual) {
        super(String.format(
            "Límite del plan alcanzado para '%s': %d/%d. Actualizá tu plan para continuar.",
            recurso, cantidadActual, limiteActual
        ));
        this.recurso = recurso;
        this.limiteActual = limiteActual;
        this.cantidadActual = cantidadActual;
    }

    public String getRecurso() { return recurso; }
    public int getLimiteActual() { return limiteActual; }
    public long getCantidadActual() { return cantidadActual; }
}
