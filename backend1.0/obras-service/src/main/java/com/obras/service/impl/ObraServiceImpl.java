package com.obras.service.impl;

import com.obras.dto.*;
import com.obras.enums.EstadoObraEnum;
import com.obras.enums.EstadoPagoEnum;
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

        obra.setEstadoObra(estado != null ? estado : EstadoObraEnum.PRESUPUESTADA);
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

        if (entity.getCostos() != null) {
            dto.setCostos(
                    entity.getCostos().stream().map(c -> {
                        ObraCostoDTO cdto = new ObraCostoDTO();
                        cdto.setId(c.getId());
                        cdto.setId_proveedor(c.getIdProveedor());
                        cdto.setDescripcion(c.getDescripcion());
                        cdto.setUnidad(c.getUnidad());
                        cdto.setCantidad(c.getCantidad());
                        cdto.setPrecio_unitario(c.getPrecioUnitario());
                        cdto.setBeneficio(c.getBeneficio());
                        cdto.setSubtotal(c.getSubtotal());
                        cdto.setTotal(c.getTotal());
                        cdto.setEstado_pago(c.getEstadoPago());
                        cdto.setActivo(c.getActivo());
                        cdto.setUltima_actualizacion(c.getUltimaActualizacion());
                        cdto.setTipo_actualizacion(c.getTipoActualizacion());
                        return cdto;
                    }).toList()
            );
        }

        return dto;
    }

    /* ============================================================
                          MAPEO DE COSTOS
       ============================================================ */

    private List<ObraCosto> mapearCostos(List<ObraCostoDTO> costosDto, Obra obra) {
        return costosDto.stream().map(cdto -> {
            BigDecimal cantidad = cdto.getCantidad() != null ? cdto.getCantidad() : BigDecimal.ZERO;
            BigDecimal precio = cdto.getPrecio_unitario() != null ? cdto.getPrecio_unitario() : BigDecimal.ZERO;
            BigDecimal beneficio = cdto.getBeneficio() != null ? cdto.getBeneficio() : BigDecimal.ZERO;

            BigDecimal subtotal = cantidad.multiply(precio);
            BigDecimal total = subtotal.multiply(BigDecimal.ONE.add(
                    beneficio.divide(new BigDecimal("100"))
            ));

            return ObraCosto.builder()
                    .id(cdto.getId())
                    .idProveedor(cdto.getId_proveedor())
                    .descripcion(cdto.getDescripcion())
                    .unidad(cdto.getUnidad())
                    .cantidad(cdto.getCantidad())
                    .precioUnitario(cdto.getPrecio_unitario())
                    .beneficio(cdto.getBeneficio())
                    .subtotal(subtotal)
                    .total(total)
                    .estadoPago(cdto.getEstado_pago() != null ? cdto.getEstado_pago() : EstadoPagoEnum.PENDIENTE)
                    .activo(cdto.getActivo() != null ? cdto.getActivo() : Boolean.TRUE)
                    .obra(obra)
                    .build();
        }).toList();
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
}
