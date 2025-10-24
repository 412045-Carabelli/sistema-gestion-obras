package com.obras.service.impl;

import com.obras.dto.*;
import com.obras.entity.EstadoObra;
import com.obras.entity.EstadoPago;
import com.obras.entity.Obra;
import com.obras.entity.ObraCosto;
import com.obras.repository.EstadoObraRepository;
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
    private final EstadoObraRepository estadoObraRepository;

    @Override
    public ObraDTO crear(ObraDTO dto) {
        Obra obra = toEntity(dto);
        obra.setActivo(true);
        obra.setCreadoEn(Instant.now());
        return toDto(obraRepo.save(obra));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ObraDTO> obtener(Long id) {
        return obraRepo.findByIdAndActivoTrue(id).map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ObraDTO> listar(Pageable p) {
        Page<Obra> page = obraRepo.findByActivoTrue(p);
        List<ObraDTO> dtos = page.stream().map(this::toDto).collect(Collectors.toList());
        return new PageImpl<>(dtos, p, page.getTotalElements());
    }

    @Override
    public ObraDTO actualizar(Long id, ObraDTO dto) {
        Obra existing = obraRepo.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new RuntimeException("Obra no encontrada o inactiva: " + id));

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

        if (dto.getObra_estado() != null && dto.getObra_estado().getId() != null) {
            EstadoObra estado = estadoObraRepository.findById(dto.getObra_estado().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Estado de obra no encontrado"));
            existing.setEstadoObra(estado);
        }

        return toDto(obraRepo.save(existing));
    }

    @Override
    public void cambiarEstado(Long idObra, Long idEstadoObra) {
        EstadoObra estado = estadoObraRepository.findById(idEstadoObra)
                .orElseThrow(() -> new EntityNotFoundException("Estado de obra no encontrado"));

        Obra obra = obraRepo.findByIdAndActivoTrue(idObra)
                .orElseThrow(() -> new EntityNotFoundException("Obra no encontrada o inactiva"));

        obra.setEstadoObra(estado);
        obraRepo.save(obra);
    }

    @Override
    public void activar(Long idObra, boolean activo) {
        obraRepo.findById(idObra).ifPresent(obra -> {
            obra.setActivo(activo);
            obraRepo.save(obra);
        });
    }

    // ======================
    // 🧭 Mapeos DTO <-> Entidad
    // ======================

    private ObraDTO toDto(Obra entity) {
        if (entity == null) return null;

        ObraDTO dto = new ObraDTO();
        dto.setId(entity.getId());
        dto.setId_cliente(entity.getIdCliente());

        if (entity.getEstadoObra() != null) {
            ObraEstadoDTO estadoDto = new ObraEstadoDTO();
            estadoDto.setId(entity.getEstadoObra().getId());
            estadoDto.setNombre(entity.getEstadoObra().getNombre());
            estadoDto.setActivo(entity.getEstadoObra().getActivo());
            dto.setObra_estado(estadoDto);
        }

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

        if (entity.getCostos() != null) {
            List<ObraCostoDTO> costosDTO = entity.getCostos().stream()
                    .map(c -> {
                        ObraCostoDTO cdto = new ObraCostoDTO();
                        cdto.setId(c.getId());
                        cdto.setId_proveedor(c.getIdProveedor());
                        cdto.setDescripcion(c.getDescripcion());
                        cdto.setUnidad(c.getUnidad());
                        cdto.setCantidad(c.getCantidad());
                        cdto.setPrecio_unitario(c.getPrecioUnitario());
                        cdto.setBeneficio(c.getBeneficio());
                        return cdto;
                    })
                    .collect(Collectors.toList());
            dto.setCostos(costosDTO);
        }

        return dto;
    }

    private Obra toEntity(ObraDTO dto) {
        if (dto == null) return null;

        Obra entity = new Obra();
        entity.setId(dto.getId());
        entity.setIdCliente(dto.getId_cliente());

        if (dto.getObra_estado() != null && dto.getObra_estado().getId() != null) {
            EstadoObra estado = estadoObraRepository.findById(dto.getObra_estado().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Estado de obra no encontrado"));
            entity.setEstadoObra(estado);
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

        if (dto.getCostos() != null) {
            entity.setCostos(mapearCostos(dto.getCostos(), entity));
        }

        return entity;
    }

    // ======================
    // 🧮 Mapeo centralizado de costos
    // ======================

    private List<ObraCosto> mapearCostos(List<ObraCostoDTO> costosDto, Obra obra) {
        return costosDto.stream().map(cdto -> {
            BigDecimal cantidad = cdto.getCantidad() != null ? cdto.getCantidad() : BigDecimal.ZERO;
            BigDecimal precio = cdto.getPrecio_unitario() != null ? cdto.getPrecio_unitario() : BigDecimal.ZERO;
            BigDecimal beneficio = cdto.getBeneficio() != null ? cdto.getBeneficio() : BigDecimal.ZERO;

            BigDecimal subtotal = cantidad.multiply(precio);
            BigDecimal total = subtotal.multiply(BigDecimal.ONE.add(beneficio.divide(new BigDecimal("100"))));

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
                    .estadoPago(
                            EstadoPago.builder()
                                    .id(cdto.getId_estado_pago() != null ? cdto.getId_estado_pago() : 1L)
                                    .build()
                    )
                    .activo(cdto.getActivo() != null ? cdto.getActivo() : Boolean.TRUE)
                    .obra(obra)
                    .build();
        }).collect(Collectors.toList());
    }

}
