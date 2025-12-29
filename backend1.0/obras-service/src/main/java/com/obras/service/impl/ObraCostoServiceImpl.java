package com.obras.service.impl;

import com.obras.dto.ObraCostoDTO;
import com.obras.entity.ObraCosto;
import com.obras.enums.EstadoPagoEnum;
import com.obras.enums.TipoCostoEnum;
import com.obras.repository.ObraCostoRepository;
import com.obras.repository.ObraRepository;
import com.obras.service.ObraCostoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ObraCostoServiceImpl implements ObraCostoService {

    private final ObraCostoRepository costoRepo;
    private final ObraRepository obraRepo;

    // Crear costo
    @Override
    public ObraCostoDTO crear(ObraCostoDTO dto) {
        if (dto.getTipo_costo() == null) {
            throw new IllegalArgumentException("Debes indicar el tipo de costo (ORIGINAL o ADICIONAL).");
        }
        ObraCosto entity = fromDto(dto);
        validarProveedorRequerido(entity, null);
        validarOperacionOriginalEnProgreso(entity, "crear");
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

    public ObraCostoDTO actualizar(Long idCosto, ObraCostoDTO dto) {
        ObraCosto entity = costoRepo.findByIdAndActivoTrue(idCosto)
                .orElseThrow(() -> new RuntimeException("Costo no encontrado"));
        validarOperacionOriginalEnProgreso(entity, dto.getTipo_costo(), "actualizar");
        entity.setIdProveedor(dto.getId_proveedor());
        entity.setItemNumero(normalizarItemNumero(dto.getItem_numero()));
        entity.setDescripcion(dto.getDescripcion());
        entity.setUnidad(dto.getUnidad());
        entity.setCantidad(dto.getCantidad());
        entity.setPrecioUnitario(dto.getPrecio_unitario());
        entity.setBeneficio(dto.getBeneficio());
        if (dto.getTipo_costo() != null) {
            entity.setTipoCosto(dto.getTipo_costo());
        }
        entity.setEstadoPago(dto.getEstado_pago() != null ? dto.getEstado_pago() : entity.getEstadoPago());
        validarProveedorRequerido(entity, null);
        calcularTotales(entity);
        return toDto(costoRepo.save(entity));
    }

    // Eliminar costo (lógico)
    @Override
    public void eliminar(Long id) {
        costoRepo.findByIdAndActivoTrue(id).ifPresent(costo -> {
            validarOperacionOriginalEnProgreso(costo, "eliminar");
            costo.setActivo(false);
            costoRepo.save(costo);
        });
    }

    // Listar costos por obra
    @Transactional(readOnly = true)
    @Override
    public List<ObraCostoDTO> listarPorObra(Long idObra) {
        List<ObraCosto> lst = costoRepo.findByObra_IdAndActivoTrue(idObra);
        return lst
            .stream()
            .sorted((a, b) -> {
                boolean aAdd = TipoCostoEnum.ADICIONAL.equals(a.getTipoCosto());
                boolean bAdd = TipoCostoEnum.ADICIONAL.equals(b.getTipoCosto());
                int tipoCompare = Boolean.compare(aAdd, bAdd);
                if (tipoCompare != 0) return tipoCompare;
                return Long.compare(
                        a.getId() != null ? a.getId() : 0,
                        b.getId() != null ? b.getId() : 0
                );
            })
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    // Calcular totales
    private void calcularTotales(ObraCosto entity) {
        TipoCostoEnum tipoCosto = Optional.ofNullable(entity.getTipoCosto()).orElse(TipoCostoEnum.ORIGINAL);
        entity.setTipoCosto(tipoCosto);
        validarTipoCosto(tipoCosto);

        BigDecimal subtotal = (entity.getCantidad() != null && entity.getPrecioUnitario() != null)
                ? entity.getCantidad().multiply(entity.getPrecioUnitario()).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        boolean esAdicional = tipoCosto == TipoCostoEnum.ADICIONAL;
        BigDecimal beneficioAplicado = !esAdicional && Boolean.TRUE.equals(entity.getObra().getBeneficioGlobal())
                ? Optional.ofNullable(entity.getObra().getBeneficio()).orElse(BigDecimal.ZERO)
                : Optional.ofNullable(entity.getBeneficio()).orElse(BigDecimal.ZERO);

        BigDecimal total = subtotal.multiply(
                BigDecimal.ONE.add(beneficioAplicado.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP))
        ).setScale(2, RoundingMode.HALF_UP);

        entity.setSubtotal(subtotal);
        entity.setTotal(total);
        entity.setActivo(true);
    }

    // Mapper: Entity -> DTO
    private ObraCostoDTO toDto(ObraCosto entity) {
        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setId(entity.getId());
        dto.setId_obra(entity.getObra().getId());
        dto.setId_proveedor(entity.getIdProveedor());
        dto.setItem_numero(entity.getItemNumero());
        dto.setDescripcion(entity.getDescripcion());
        dto.setUnidad(entity.getUnidad());
        dto.setCantidad(entity.getCantidad());
        dto.setPrecio_unitario(entity.getPrecioUnitario());
        dto.setBeneficio(entity.getBeneficio());
        dto.setSubtotal(entity.getSubtotal());
        dto.setTotal(entity.getTotal());
        dto.setEstado_pago(entity.getEstadoPago());
        dto.setTipo_costo(entity.getTipoCosto());
        dto.setActivo(entity.getActivo());
        dto.setUltima_actualizacion(entity.getUltimaActualizacion());
        dto.setTipo_actualizacion(entity.getTipoActualizacion());
        return dto;
    }

    // Mapper: DTO -> Entity
    private ObraCosto fromDto(ObraCostoDTO dto) {
        ObraCosto entity = new ObraCosto();
        entity.setId(dto.getId());
        entity.setIdProveedor(dto.getId_proveedor());
        entity.setItemNumero(normalizarItemNumero(dto.getItem_numero()));
        entity.setDescripcion(dto.getDescripcion());
        entity.setUnidad(dto.getUnidad());
        entity.setCantidad(dto.getCantidad());
        entity.setPrecioUnitario(dto.getPrecio_unitario());
        entity.setBeneficio(dto.getBeneficio());

        TipoCostoEnum tipoCosto = dto.getTipo_costo() != null ? dto.getTipo_costo() : TipoCostoEnum.ORIGINAL;
        validarTipoCosto(tipoCosto);
        entity.setTipoCosto(tipoCosto);
        entity.setActivo(dto.getActivo() != null ? dto.getActivo() : Boolean.TRUE);

        entity.setEstadoPago(dto.getEstado_pago() != null ? dto.getEstado_pago() : EstadoPagoEnum.PENDIENTE);
        entity.setObra(obraRepo.findById(dto.getId_obra())
                .orElseThrow(() -> new RuntimeException("Obra no encontrada para costo")));

        return entity;
    }

    private String normalizarItemNumero(String itemNumero) {
        if (itemNumero == null) return null;
        String trimmed = itemNumero.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void validarTipoCosto(TipoCostoEnum tipo) {
        if (tipo == null) {
            throw new IllegalArgumentException("El tipo de costo es obligatorio (ORIGINAL o ADICIONAL).");
        }
    }

    private void validarProveedorRequerido(ObraCosto entity, TipoCostoEnum tipoOverride) {
        if (entity == null) return;
        TipoCostoEnum tipo = tipoOverride != null ? tipoOverride : entity.getTipoCosto();
        if (TipoCostoEnum.ORIGINAL.equals(tipo) && entity.getIdProveedor() == null) {
            throw new IllegalArgumentException("Debes indicar un proveedor para costos ORIGINAL.");
        }
    }

    private void validarOperacionOriginalEnProgreso(ObraCosto entity, String accion) {
        validarOperacionOriginalEnProgreso(entity, null, accion);
    }

    private void validarOperacionOriginalEnProgreso(ObraCosto entity, TipoCostoEnum tipoNuevo, String accion) {
        if (entity == null || entity.getObra() == null) return;
        if (entity.getObra().getEstadoObra() == null) return;
        if (entity.getObra().getEstadoObra() != com.obras.enums.EstadoObraEnum.EN_PROGRESO) return;
        if (TipoCostoEnum.ORIGINAL.equals(entity.getTipoCosto()) || TipoCostoEnum.ORIGINAL.equals(tipoNuevo)) {
            throw new IllegalStateException(
                "No se puede " + accion + " un costo ORIGINAL mientras la obra esta en progreso."
            );
        }
    }
}
