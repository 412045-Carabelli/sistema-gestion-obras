package com.auth.service;

import com.auth.dto.MiPlanResponse;
import com.auth.dto.PlanRequest;
import com.auth.dto.PlanResponse;
import com.auth.entity.Plan;

import java.util.List;

public interface PlanService {
    List<PlanResponse> listar();
    PlanResponse obtenerPorId(Long id);
    PlanResponse obtenerPorCodigo(String codigo);
    PlanResponse crear(PlanRequest request);
    PlanResponse actualizar(Long id, PlanRequest request);
    void desactivar(Long id);

    // Obtiene el plan activo de una organización con todos sus límites y features
    MiPlanResponse obtenerMiPlan(Long organizacionId);

    // Usado internamente al generar JWT
    Plan obtenerPlanDeOrganizacion(Long organizacionId);

    // Cancela la suscripción activa (pasa a CANCELADA, no elimina)
    void cancelarSuscripcion(Long organizacionId);
}
