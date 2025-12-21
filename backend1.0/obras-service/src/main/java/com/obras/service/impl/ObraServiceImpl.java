package com.obras.service.impl;

import com.obras.dto.*;
import com.obras.enums.EstadoObraEnum;
import com.obras.enums.EstadoPagoEnum;
import com.obras.enums.TipoCostoEnum;
import com.obras.entity.Obra;
import com.obras.entity.ObraCosto;
import com.obras.repository.ObraRepository;
import com.obras.service.ObraService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ObraServiceImpl implements ObraService {

    private final ObraRepository obraRepo;

    /* ============================================================
                             CREAR
       ============================================================ */

    @Override
    public ObraDTO crear(ObraDTO dto) {
        validarFechas(dto);
        Obra obra = toEntity(dto);
        obra.setActivo(true);
        obra.setCreadoEn(Instant.now());
        return toDto(obraRepo.save(obra));
    }

    /* ============================================================
                             OBTENER
       ============================================================ */

    @Override
    @Transactional(readOnly = true)
    public Optional<ObraDTO> obtener(Long id) {
        return obraRepo.findById(id).map(this::toDto);
    }

    /* ============================================================
                             LISTAR
       ============================================================ */

    @Override
    @Transactional(readOnly = true)
    public Page<ObraDTO> listar(Pageable p) {
        Page<Obra> page = obraRepo.findAll(p);
        List<ObraDTO> dtos = page.stream().map(this::toDto).toList();
        return new PageImpl<>(dtos, p, page.getTotalElements());
    }

    /* ============================================================
                             ACTUALIZAR
       ============================================================ */

    @Override
    public ObraDTO actualizar(Long id, ObraDTO dto) {
        validarFechas(dto);
        Obra existing = obraRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Obra no encontrada: " + id));

        existing.setNombre(dto.getNombre());
        existing.setDireccion(dto.getDireccion());
        existing.setFechaInicio(dto.getFecha_inicio());
        existing.setFechaFin(dto.getFecha_fin());
        existing.setFechaAdjudicada(dto.getFecha_adjudicada());
        existing.setFechaPerdida(dto.getFecha_perdida());
        existing.setPresupuesto(dto.getPresupuesto());
        existing.setBeneficioGlobal(dto.getBeneficio_global());
        existing.setTieneComision(dto.getTiene_comision());
        existing.setBeneficio(dto.getBeneficio());
        existing.setComision(dto.getComision());
        existing.setIdCliente(dto.getId_cliente());

        if (dto.getObra_estado() != null) {
            existing.setEstadoObra(parseEstado(dto.getObra_estado()));
        }

        return toDto(obraRepo.save(existing));
    }

    /* ============================================================
                         CAMBIAR ESTADO
       ============================================================ */

    @Override
    public void cambiarEstado(Long idObra, EstadoObraEnum estado) {
        Obra obra = obraRepo.findById(idObra)
                .orElseThrow(() -> new EntityNotFoundException("Obra no encontrada"));

        EstadoObraEnum nuevoEstado = estado != null ? estado : EstadoObraEnum.PRESUPUESTADA;
        obra.setEstadoObra(nuevoEstado);

        if (nuevoEstado == EstadoObraEnum.ADJUDICADA) {
            obra.setFechaAdjudicada(java.time.LocalDateTime.now());
        }

        obraRepo.save(obra);
    }

    /* ============================================================
                             ACTIVAR / DESACTIVAR
       ============================================================ */

    @Override
    public void activar(Long idObra) {
        obraRepo.findById(idObra).ifPresent(obra -> {
            obra.setActivo(!Boolean.FALSE.equals(obra.getActivo()));
            obraRepo.save(obra);
        });
    }

    /* ============================================================
                           MAPEO DTO → ENTITY
       ============================================================ */

    private Obra toEntity(ObraDTO dto) {
        if (dto == null) return null;

        Obra entity = new Obra();
        entity.setId(dto.getId());
        entity.setIdCliente(dto.getId_cliente());

        if (dto.getObra_estado() != null) {
            entity.setEstadoObra(parseEstado(dto.getObra_estado()));
        }

        entity.setNombre(dto.getNombre());
        entity.setDireccion(dto.getDireccion());
        entity.setFechaPresupuesto(dto.getFecha_presupuesto());
        entity.setFechaInicio(dto.getFecha_inicio());
        entity.setFechaFin(dto.getFecha_fin());
        entity.setFechaAdjudicada(dto.getFecha_adjudicada());
        entity.setFechaPerdida(dto.getFecha_perdida());
        entity.setPresupuesto(dto.getPresupuesto());
        entity.setBeneficioGlobal(dto.getBeneficio_global());
        entity.setTieneComision(dto.getTiene_comision());
        entity.setBeneficio(dto.getBeneficio());
        entity.setComision(dto.getComision());
        entity.setNotas(dto.getNotas());
        entity.setActivo(dto.getActivo());

        if (dto.getCostos() != null) {
            entity.setCostos(mapearCostos(dto.getCostos(), entity));
        }

        return entity;
    }

    /* ============================================================
                           MAPEO ENTITY → DTO
       ============================================================ */

    private ObraDTO toDto(Obra entity) {
        if (entity == null) return null;

        ObraDTO dto = new ObraDTO();
        dto.setId(entity.getId());
        dto.setId_cliente(entity.getIdCliente());
        dto.setObra_estado(entity.getEstadoObra());
        dto.setNombre(entity.getNombre());
        dto.setDireccion(entity.getDireccion());
        dto.setFecha_presupuesto(entity.getFechaPresupuesto());
        dto.setFecha_inicio(entity.getFechaInicio());
        dto.setFecha_fin(entity.getFechaFin());
        dto.setFecha_adjudicada(entity.getFechaAdjudicada());
        dto.setFecha_perdida(entity.getFechaPerdida());
        dto.setPresupuesto(entity.getPresupuesto());
        dto.setBeneficio_global(entity.getBeneficioGlobal());
        dto.setTiene_comision(entity.getTieneComision());
        dto.setBeneficio(entity.getBeneficio());
        dto.setComision(entity.getComision());
        dto.setNotas(entity.getNotas());
        dto.setActivo(entity.getActivo());
        dto.setCreado_en(entity.getCreadoEn());
        dto.setUltima_actualizacion(entity.getUltimaActualizacion());
        dto.setTipo_actualizacion(entity.getTipoActualizacion());

        TotalesObra totales = calcularTotalesObra(entity);
        dto.setSubtotal_costos(totales.subtotalCostos());
        dto.setBeneficio_costos(totales.beneficioCostos());
        dto.setTotal_con_beneficio(totales.totalConBeneficio());
        dto.setComision_monto(totales.comisionMonto());
        dto.setBeneficio_neto(totales.beneficioNeto());
        dto.setPresupuesto(totales.presupuestoFinal());

        if (entity.getCostos() != null) {
            dto.setCostos(
                entity.getCostos().stream()
                    .sorted((a, b) -> {
                        boolean aAdd = com.obras.enums.TipoCostoEnum.ADICIONAL.equals(a.getTipoCosto());
                        boolean bAdd = com.obras.enums.TipoCostoEnum.ADICIONAL.equals(b.getTipoCosto());
                        int tipoCompare = Boolean.compare(aAdd, bAdd);
                        if (tipoCompare != 0) return tipoCompare;
                        return Long.compare(
                                a.getId() != null ? a.getId() : 0,
                                b.getId() != null ? b.getId() : 0
                        );
                    })
                    .map(c -> {
                        ObraCostoDTO cdto = new ObraCostoDTO();
                        cdto.setId(c.getId());
                        cdto.setId_proveedor(c.getIdProveedor());
                        cdto.setItem_numero(c.getItemNumero());
                        cdto.setDescripcion(c.getDescripcion());
                        cdto.setUnidad(c.getUnidad());
                        cdto.setCantidad(c.getCantidad());
                        cdto.setPrecio_unitario(c.getPrecioUnitario());
                        cdto.setBeneficio(c.getBeneficio());
                        cdto.setSubtotal(c.getSubtotal());
                        cdto.setTotal(c.getTotal());
                        cdto.setEstado_pago(c.getEstadoPago());
                        cdto.setTipo_costo(c.getTipoCosto());
                        cdto.setActivo(c.getActivo());
                        cdto.setUltima_actualizacion(c.getUltimaActualizacion());
                        cdto.setTipo_actualizacion(c.getTipoActualizacion());
                        return cdto;
                    }).toList()
            );
        }

        return dto;
    }

    private void validarFechas(ObraDTO dto) {
        if (dto == null) return;
        if (dto.getFecha_inicio() != null && dto.getFecha_fin() != null
                && dto.getFecha_inicio().isAfter(dto.getFecha_fin())) {
            throw new IllegalArgumentException("La fecha de inicio no puede ser posterior a la fecha de fin.");
        }
    }

    /* ============================================================
                          MAPEO DE COSTOS
       ============================================================ */

    private List<ObraCosto> mapearCostos(List<ObraCostoDTO> costosDto, Obra obra) {
        return costosDto.stream().map(cdto -> {
            BigDecimal cantidad = cdto.getCantidad() != null ? cdto.getCantidad() : BigDecimal.ZERO;
            BigDecimal precio = cdto.getPrecio_unitario() != null ? cdto.getPrecio_unitario() : BigDecimal.ZERO;
            BigDecimal beneficioCosto = cdto.getBeneficio() != null ? cdto.getBeneficio() : BigDecimal.ZERO;
            TipoCostoEnum tipoCosto = cdto.getTipo_costo() != null ? cdto.getTipo_costo() : TipoCostoEnum.ORIGINAL;

            BigDecimal subtotal = cantidad.multiply(precio);
            BigDecimal beneficioAplicado = Boolean.TRUE.equals(obra.getBeneficioGlobal()) && tipoCosto == TipoCostoEnum.ORIGINAL
                    ? Optional.ofNullable(obra.getBeneficio()).orElse(BigDecimal.ZERO)
                    : beneficioCosto;

            BigDecimal total = subtotal.multiply(
                    BigDecimal.ONE.add(beneficioAplicado.divide(new BigDecimal("100"), 6, java.math.RoundingMode.HALF_UP))
            ).setScale(2, java.math.RoundingMode.HALF_UP);

            return ObraCosto.builder()
                    .id(cdto.getId())
                    .idProveedor(cdto.getId_proveedor())
                    .itemNumero(normalizarItemNumero(cdto.getItem_numero()))
                    .descripcion(cdto.getDescripcion())
                    .unidad(cdto.getUnidad())
                    .cantidad(cdto.getCantidad())
                    .precioUnitario(cdto.getPrecio_unitario())
                    .beneficio(cdto.getBeneficio())
                    .tipoCosto(tipoCosto)
                    .subtotal(subtotal)
                    .total(total)
                    .estadoPago(cdto.getEstado_pago() != null ? cdto.getEstado_pago() : EstadoPagoEnum.PENDIENTE)
                    .activo(cdto.getActivo() != null ? cdto.getActivo() : Boolean.TRUE)
                    .obra(obra)
                    .build();
        }).toList();
    }

    private String normalizarItemNumero(String itemNumero) {
        if (itemNumero == null) return null;
        String trimmed = itemNumero.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /* ============================================================
                      HELPER — PARSEAR ENUM
       ============================================================ */

    private EstadoObraEnum parseEstado(Object estado) {
        if (estado instanceof EstadoObraEnum e) return e;

        if (estado instanceof String s) {
            try {
                return EstadoObraEnum.valueOf(s.toUpperCase());
            } catch (Exception ex) {
                throw new RuntimeException("Estado de obra inválido: " + s);
            }
        }

        throw new RuntimeException("Valor de estado de obra no soportado: " + estado);
    }
    private TotalesObra calcularTotalesObra(Obra obra) {
        if (obra == null || obra.getCostos() == null || obra.getCostos().isEmpty()) {
            return new TotalesObra(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, obra != null ? obra.getPresupuesto() : BigDecimal.ZERO);
        }

        BigDecimal subtotalCostos = BigDecimal.ZERO;
        BigDecimal beneficioCostos = BigDecimal.ZERO;

        for (ObraCosto costo : obra.getCostos()) {
            BigDecimal base = costo.getSubtotal() != null
                    ? costo.getSubtotal()
                    : Optional.ofNullable(costo.getCantidad()).orElse(BigDecimal.ZERO)
                    .multiply(Optional.ofNullable(costo.getPrecioUnitario()).orElse(BigDecimal.ZERO));

            boolean esAdicional = TipoCostoEnum.ADICIONAL.equals(costo.getTipoCosto());
            BigDecimal beneficioAplicado = esAdicional
                    ? Optional.ofNullable(costo.getBeneficio()).orElse(BigDecimal.ZERO)
                    : (Boolean.TRUE.equals(obra.getBeneficioGlobal())
                    ? Optional.ofNullable(obra.getBeneficio()).orElse(BigDecimal.ZERO)
                    : Optional.ofNullable(costo.getBeneficio()).orElse(BigDecimal.ZERO));

            subtotalCostos = subtotalCostos.add(base);
            beneficioCostos = beneficioCostos.add(
                    base.multiply(beneficioAplicado).divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP)
            );
        }

        BigDecimal totalConBeneficio = subtotalCostos.add(beneficioCostos);
        BigDecimal comisionMonto = BigDecimal.ZERO;
        if (Boolean.TRUE.equals(obra.getTieneComision()) && obra.getComision() != null) {
            comisionMonto = totalConBeneficio.multiply(
                    obra.getComision().divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP)
            );
        }

        BigDecimal beneficioNeto = beneficioCostos.subtract(comisionMonto);
        BigDecimal presupuestoFinal = totalConBeneficio.add(comisionMonto);

        return new TotalesObra(
                subtotalCostos.setScale(2, RoundingMode.HALF_UP),
                beneficioCostos.setScale(2, RoundingMode.HALF_UP),
                totalConBeneficio.setScale(2, RoundingMode.HALF_UP),
                comisionMonto.setScale(2, RoundingMode.HALF_UP),
                beneficioNeto.setScale(2, RoundingMode.HALF_UP),
                presupuestoFinal.setScale(2, RoundingMode.HALF_UP)
        );
    }

    private record TotalesObra(
            BigDecimal subtotalCostos,
            BigDecimal beneficioCostos,
            BigDecimal totalConBeneficio,
            BigDecimal comisionMonto,
            BigDecimal beneficioNeto,
            BigDecimal presupuestoFinal
    ) {
    }
}
