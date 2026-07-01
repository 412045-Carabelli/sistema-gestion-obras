package com.auth.service.impl;

import com.auth.dto.DescuentoRequest;
import com.auth.dto.DescuentoResponse;
import com.auth.entity.Descuento;
import com.auth.entity.Plan;
import com.auth.exception.ResourceNotFoundException;
import com.auth.repository.DescuentoRepository;
import com.auth.repository.PlanRepository;
import com.auth.service.DescuentoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class DescuentoServiceImpl implements DescuentoService {

    private final DescuentoRepository descuentoRepository;
    private final PlanRepository planRepository;

    @Override
    @Transactional(readOnly = true)
    public List<DescuentoResponse> listar() {
        return descuentoRepository.findAll().stream()
                .map(DescuentoResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DescuentoResponse> listarVigentes() {
        return descuentoRepository.findVigentes(Instant.now()).stream()
                .map(DescuentoResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DescuentoResponse obtenerPorId(Long id) {
        return DescuentoResponse.from(findOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public DescuentoResponse obtenerPorCodigo(String codigo) {
        Descuento d = descuentoRepository.findByCodigo(codigo.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Cupón '" + codigo + "' no existe"));
        return DescuentoResponse.from(d);
    }

    @Override
    public DescuentoResponse crear(DescuentoRequest request, String creadoPor) {
        descuentoRepository.findByCodigo(request.getCodigo().toUpperCase())
                .ifPresent(d -> { throw new IllegalArgumentException("Código de cupón ya existe: " + request.getCodigo()); });

        Descuento d = mapToEntity(new Descuento(), request);
        d.setCodigo(request.getCodigo().toUpperCase());
        d.setCreadoPor(creadoPor);
        return DescuentoResponse.from(descuentoRepository.save(d));
    }

    @Override
    public DescuentoResponse actualizar(Long id, DescuentoRequest request) {
        Descuento d = findOrThrow(id);
        mapToEntity(d, request);
        return DescuentoResponse.from(descuentoRepository.save(d));
    }

    @Override
    public void desactivar(Long id) {
        Descuento d = findOrThrow(id);
        d.setActivo(Boolean.FALSE);
        descuentoRepository.save(d);
        log.info("Descuento {} desactivado", d.getCodigo());
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calcularDescuento(String codigoCupon, BigDecimal precioBase, Long planId, String ciclo) {
        if (codigoCupon == null || codigoCupon.isBlank()) return BigDecimal.ZERO;

        Descuento d = descuentoRepository.findByCodigo(codigoCupon.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Cupón '" + codigoCupon + "' no existe"));

        if (!d.estaVigente()) {
            throw new IllegalArgumentException("El cupón '" + codigoCupon + "' no está vigente");
        }

        // Validar restricción de plan
        if (d.getPlan() != null && !d.getPlan().getId().equals(planId)) {
            throw new IllegalArgumentException("El cupón '" + codigoCupon + "' no aplica a este plan");
        }

        // Validar restricción de ciclo
        if (d.getAplicaCiclo() != null && !d.getAplicaCiclo().equals(ciclo)) {
            throw new IllegalArgumentException("El cupón '" + codigoCupon + "' no aplica al ciclo " + ciclo);
        }

        if ("PORCENTAJE".equals(d.getTipo())) {
            return precioBase.multiply(d.getValor())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            // MONTO_FIJO — no puede superar el precio base
            return d.getValor().min(precioBase);
        }
    }

    @Override
    public void registrarUso(String codigoCupon) {
        Descuento d = descuentoRepository.findByCodigo(codigoCupon.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Cupón '" + codigoCupon + "' no existe"));
        d.setUsosActuales(d.getUsosActuales() + 1);
        descuentoRepository.save(d);
        log.info("Uso registrado para cupón {}: {}/{}", d.getCodigo(), d.getUsosActuales(), d.getMaxUsos());
    }

    // --- helpers privados ---

    private Descuento findOrThrow(Long id) {
        return descuentoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Descuento " + id + " no existe"));
    }

    private Descuento mapToEntity(Descuento d, DescuentoRequest req) {
        d.setCodigo(req.getCodigo().toUpperCase());
        d.setDescripcion(req.getDescripcion());
        d.setTipo(req.getTipo());
        d.setValor(req.getValor());
        d.setAplicaCiclo(req.getAplicaCiclo());
        d.setValidoDesde(req.getValidoDesde() != null ? req.getValidoDesde() : Instant.now());
        d.setValidoHasta(req.getValidoHasta());
        d.setMaxUsos(req.getMaxUsos());
        d.setSoloPrimerPago(req.getSoloPrimerPago() != null ? req.getSoloPrimerPago() : Boolean.FALSE);
        d.setActivo(Boolean.TRUE);

        if (req.getPlanId() != null) {
            Plan plan = planRepository.findById(req.getPlanId())
                    .orElseThrow(() -> new ResourceNotFoundException("Plan " + req.getPlanId() + " no existe"));
            d.setPlan(plan);
        } else {
            d.setPlan(null);
        }
        return d;
    }
}
