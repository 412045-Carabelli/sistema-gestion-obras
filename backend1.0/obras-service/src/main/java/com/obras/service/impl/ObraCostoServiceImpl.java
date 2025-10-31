package com.obras.service.impl;

import com.obras.dto.ObraCostoDTO;
import com.obras.entity.EstadoPago;
import com.obras.entity.ObraCosto;
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
    public ObraCostoDTO actualizarEstadoPago(Long idCosto, Long idEstadoPago) {
        ObraCosto entity = costoRepo.findByIdAndActivoTrue(idCosto)
                .orElseThrow(() -> new RuntimeException("Costo no encontrado"));

        entity.setEstadoPago(EstadoPago.builder().id(idEstadoPago).build());
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
        dto.setId_estado_pago(entity.getEstadoPago() != null ? entity.getEstadoPago().getId() : null);
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

        if (dto.getId_estado_pago() != null) {
            entity.setEstadoPago(EstadoPago.builder().id(dto.getId_estado_pago()).build());
        } else {
            entity.setEstadoPago(null);
        }

        return entity;
    }
}
