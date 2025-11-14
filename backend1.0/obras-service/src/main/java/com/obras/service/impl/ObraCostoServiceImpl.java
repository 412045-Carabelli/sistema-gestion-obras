package com.obras.service.impl;

import com.obras.dto.ObraCostoDTO;
import com.obras.entity.ObraCosto;
import com.obras.enums.EstadoPagoEnum;
import com.obras.repository.ObraCostoRepository;
import com.obras.service.ObraCostoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ObraCostoServiceImpl implements ObraCostoService {

    private final ObraCostoRepository costoRepo;

    // ============================
    // 🔸 Crear costo
    // ============================
    @Override
    public ObraCostoDTO crear(ObraCostoDTO dto) {
        ObraCosto entity = fromDto(dto);
        calcularTotales(entity);
        entity = costoRepo.save(entity);
        return toDto(entity);
    }

    @Override
    public ObraCostoDTO actualizarEstadoPago(Long idCosto, EstadoPagoEnum estado) {
        ObraCosto entity = costoRepo.findByIdAndActivoTrue(idCosto)
                .orElseThrow(() -> new RuntimeException("Costo no encontrado"));

        entity.setEstadoPago(estado != null ? estado : EstadoPagoEnum.PENDIENTE);
        entity = costoRepo.save(entity);

        return toDto(entity);
    }

    // ============================
    // 🔸 Eliminar costo (lógico)
    // ============================
    @Override
    public void eliminar(Long id) {
        costoRepo.findByIdAndActivoTrue(id).ifPresent(costo -> {
            costo.setActivo(false);
            costoRepo.save(costo);
        });
    }

    // ============================
    // 🔸 Listar costos por obra
    // ============================
    @Transactional(readOnly = true)
    @Override
    public List<ObraCostoDTO> listarPorObra(Long idObra) {
        List<ObraCosto> lst = costoRepo.findByObra_IdAndActivoTrue(idObra);
        return lst
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ============================
    // 🧮 Calcular totales
    // ============================
    private void calcularTotales(ObraCosto entity) {
        BigDecimal subtotal = (entity.getCantidad() != null && entity.getPrecioUnitario() != null)
                ? entity.getCantidad().multiply(entity.getPrecioUnitario()).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        entity.setSubtotal(subtotal);
        entity.setTotal(subtotal);
        entity.setActivo(true);
    }

    // ============================
    // 🧭 Mapper: Entity → DTO
    // ============================
    private ObraCostoDTO toDto(ObraCosto entity) {
        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setId(entity.getId());
        dto.setId_obra(entity.getObra().getId());
        dto.setId_proveedor(entity.getIdProveedor());
        dto.setDescripcion(entity.getDescripcion());
        dto.setUnidad(entity.getUnidad());
        dto.setCantidad(entity.getCantidad());
        dto.setPrecio_unitario(entity.getPrecioUnitario());
        dto.setBeneficio(entity.getBeneficio());
        dto.setSubtotal(entity.getSubtotal());
        dto.setTotal(entity.getTotal());
        dto.setEstado_pago(entity.getEstadoPago());
        dto.setActivo(entity.getActivo());
        dto.setUltima_actualizacion(entity.getUltimaActualizacion());
        dto.setTipo_actualizacion(entity.getTipoActualizacion());
        return dto;
    }

    // ============================
    // 🧭 Mapper: DTO → Entity
    // ============================
    private ObraCosto fromDto(ObraCostoDTO dto) {
        ObraCosto entity = new ObraCosto();
        entity.setId(dto.getId());
        entity.setIdProveedor(dto.getId_proveedor());
        entity.setDescripcion(dto.getDescripcion());
        entity.setUnidad(dto.getUnidad());
        entity.setCantidad(dto.getCantidad());
        entity.setPrecioUnitario(dto.getPrecio_unitario());
        entity.setBeneficio(dto.getBeneficio());
        entity.setActivo(dto.getActivo() != null ? dto.getActivo() : Boolean.TRUE);

        entity.setEstadoPago(dto.getEstado_pago() != null ? dto.getEstado_pago() : EstadoPagoEnum.PENDIENTE);

        return entity;
    }

    private Long mapEstadoPagoToId(EstadoPagoEnum e) {
        return switch (e) {
            case PENDIENTE -> 1L;
            case PARCIAL -> 2L;
            case PAGADO -> 3L;
        };
    }

    private EstadoPagoEnum mapIdToEstadoPago(Long id) {
        return switch (id != null ? id.intValue() : -1) {
            case 1 -> EstadoPagoEnum.PENDIENTE;
            case 2 -> EstadoPagoEnum.PARCIAL;
            case 3 -> EstadoPagoEnum.PAGADO;
            default -> EstadoPagoEnum.PENDIENTE;
        };
    }
}
