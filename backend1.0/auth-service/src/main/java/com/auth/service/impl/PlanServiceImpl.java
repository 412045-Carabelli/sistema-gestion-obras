package com.auth.service.impl;

import com.auth.dto.MiPlanResponse;
import com.auth.dto.PlanRequest;
import com.auth.dto.PlanResponse;
import com.auth.entity.Organizacion;
import com.auth.entity.Plan;
import com.auth.entity.Suscripcion;
import com.auth.exception.ResourceNotFoundException;
import com.auth.repository.OrganizacionRepository;
import com.auth.repository.PlanRepository;
import com.auth.repository.SuscripcionRepository;
import com.auth.service.PlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PlanServiceImpl implements PlanService {

    private final PlanRepository planRepository;
    private final OrganizacionRepository organizacionRepository;
    private final SuscripcionRepository suscripcionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PlanResponse> listar() {
        return planRepository.findAll().stream()
                .map(PlanResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PlanResponse obtenerPorId(Long id) {
        return PlanResponse.from(findOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PlanResponse obtenerPorCodigo(String codigo) {
        Plan plan = planRepository.findByCodigo(codigo.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Plan con código " + codigo + " no existe"));
        return PlanResponse.from(plan);
    }

    @Override
    public PlanResponse crear(PlanRequest request) {
        if (planRepository.existsByCodigo(request.getCodigo().toUpperCase())) {
            throw new IllegalArgumentException("Ya existe un plan con código " + request.getCodigo());
        }
        Plan plan = mapToEntity(new Plan(), request);
        return PlanResponse.from(planRepository.save(plan));
    }

    @Override
    public PlanResponse actualizar(Long id, PlanRequest request) {
        Plan plan = findOrThrow(id);
        mapToEntity(plan, request);
        return PlanResponse.from(planRepository.save(plan));
    }

    @Override
    public void desactivar(Long id) {
        Plan plan = findOrThrow(id);
        plan.setActivo(Boolean.FALSE);
        planRepository.save(plan);
        log.info("Plan {} desactivado", plan.getCodigo());
    }

    @Override
    @Transactional(readOnly = true)
    public MiPlanResponse obtenerMiPlan(Long organizacionId) {
        Organizacion org = organizacionRepository.findById(organizacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Organización " + organizacionId + " no existe"));

        Plan plan = org.getPlan();
        if (plan == null) {
            plan = planRepository.findByCodigo("FREE")
                    .orElseThrow(() -> new IllegalStateException("Plan FREE no configurado"));
        }

        Suscripcion suscripcion = suscripcionRepository
                .findActivaByOrganizacionId(organizacionId)
                .orElse(null);

        return buildMiPlanResponse(plan, suscripcion);
    }

    @Override
    @Transactional(readOnly = true)
    public Plan obtenerPlanDeOrganizacion(Long organizacionId) {
        return organizacionRepository.findById(organizacionId)
                .map(Organizacion::getPlan)
                .orElse(planRepository.findByCodigo("FREE")
                        .orElseThrow(() -> new IllegalStateException("Plan FREE no configurado")));
    }

    // --- helpers privados ---

    private Plan findOrThrow(Long id) {
        return planRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan " + id + " no existe"));
    }

    private Plan mapToEntity(Plan plan, PlanRequest req) {
        plan.setCodigo(req.getCodigo().toUpperCase());
        plan.setNombre(req.getNombre());
        plan.setDescripcion(req.getDescripcion());
        plan.setPrecioMensualUsd(req.getPrecioMensualUsd());
        plan.setPrecioAnualUsd(req.getPrecioAnualUsd());
        plan.setMaxUsuarios(req.getMaxUsuarios());
        plan.setMaxObrasActivas(req.getMaxObrasActivas());
        plan.setMaxClientes(req.getMaxClientes());
        plan.setMaxProveedores(req.getMaxProveedores());
        plan.setMaxTransaccionesMes(req.getMaxTransaccionesMes());
        plan.setMaxStorageMb(req.getMaxStorageMb());
        plan.setDiasHistorialReportes(req.getDiasHistorialReportes());
        plan.setTieneFacturas(req.getTieneFacturas() != null ? req.getTieneFacturas() : Boolean.FALSE);
        plan.setTieneAgenda(req.getTieneAgenda() != null ? req.getTieneAgenda() : Boolean.FALSE);
        plan.setTieneGruposObras(req.getTieneGruposObras() != null ? req.getTieneGruposObras() : Boolean.FALSE);
        plan.setTieneExportar(req.getTieneExportar() != null ? req.getTieneExportar() : Boolean.FALSE);
        plan.setTienePushNotifications(req.getTienePushNotifications() != null ? req.getTienePushNotifications() : Boolean.FALSE);
        plan.setTieneSoportePrioritario(req.getTieneSoportePrioritario() != null ? req.getTieneSoportePrioritario() : Boolean.FALSE);
        plan.setTieneApiAccess(req.getTieneApiAccess() != null ? req.getTieneApiAccess() : Boolean.FALSE);
        plan.setActivo(Boolean.TRUE);
        return plan;
    }

    private MiPlanResponse buildMiPlanResponse(Plan plan, Suscripcion suscripcion) {
        List<String> features = new ArrayList<>();
        if (Boolean.TRUE.equals(plan.getTieneFacturas())) features.add("facturas");
        if (Boolean.TRUE.equals(plan.getTieneAgenda())) features.add("agenda");
        if (Boolean.TRUE.equals(plan.getTieneGruposObras())) features.add("grupos_obras");
        if (Boolean.TRUE.equals(plan.getTieneExportar())) features.add("exportar");
        if (Boolean.TRUE.equals(plan.getTienePushNotifications())) features.add("push_notifications");
        if (Boolean.TRUE.equals(plan.getTieneSoportePrioritario())) features.add("soporte_prioritario");
        if (Boolean.TRUE.equals(plan.getTieneApiAccess())) features.add("api_access");

        return MiPlanResponse.builder()
                .planCodigo(plan.getCodigo())
                .planNombre(plan.getNombre())
                .precioMensualUsd(plan.getPrecioMensualUsd())
                .precioAnualUsd(plan.getPrecioAnualUsd())
                .maxUsuarios(plan.getMaxUsuarios())
                .maxObrasActivas(plan.getMaxObrasActivas())
                .maxClientes(plan.getMaxClientes())
                .maxProveedores(plan.getMaxProveedores())
                .maxTransaccionesMes(plan.getMaxTransaccionesMes())
                .maxStorageMb(plan.getMaxStorageMb())
                .diasHistorialReportes(plan.getDiasHistorialReportes())
                .tieneFacturas(plan.getTieneFacturas())
                .tieneAgenda(plan.getTieneAgenda())
                .tieneGruposObras(plan.getTieneGruposObras())
                .tieneExportar(plan.getTieneExportar())
                .tienePushNotifications(plan.getTienePushNotifications())
                .tieneSoportePrioritario(plan.getTieneSoportePrioritario())
                .tieneApiAccess(plan.getTieneApiAccess())
                .featuresHabilitadas(features)
                .suscripcionEstado(suscripcion != null ? suscripcion.getEstado() : "FREE")
                .ciclo(suscripcion != null ? suscripcion.getCiclo() : null)
                .fechaVencimiento(suscripcion != null ? suscripcion.getFechaVencimiento() : null)
                .precioFinalUsd(suscripcion != null ? suscripcion.getPrecioFinalUsd() : plan.getPrecioMensualUsd())
                .build();
    }
}
