package com.transacciones.service;

import com.transacciones.dto.ObraCostoDto;
import com.transacciones.dto.TransaccionDto;
import com.transacciones.entity.Transaccion;
import com.transacciones.enums.TipoTransaccionEnum;
import com.transacciones.repository.TransaccionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransaccionService {

    private static final Logger log = LoggerFactory.getLogger(TransaccionService.class);

    private final TransaccionRepository transaccionRepository;
    private final ObraCostoClient obraCostoClient;

    public List<TransaccionDto> listar() {
        return transaccionRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public TransaccionDto crear(Transaccion dto) {
        if (dto.getTipo_transaccion() == null) {
            throw new IllegalArgumentException("Debe especificarse un tipo de transaccion valido");
        }
        validarTipoAsociado(dto);
        validarMontoContraCosto(dto);

        Transaccion entity = Transaccion.builder()
                .idObra(dto.getIdObra())
                .idAsociado(dto.getIdAsociado())
                .idCosto(dto.getIdCosto())
                .tipoAsociado(dto.getTipoAsociado())
                .tipo_transaccion(dto.getTipo_transaccion())
                .fecha(dto.getFecha())
                .monto(dto.getMonto())
                .forma_pago(dto.getForma_pago())
                .medio_pago(dto.getMedio_pago())
                .facturaCobrada(dto.getFacturaCobrada())
                .activo(dto.getActivo() != null ? dto.getActivo() : true)
                .build();

        Transaccion guardado = transaccionRepository.save(entity);
        actualizarEstadoCostoDesdeMovimiento(guardado);
        return toDto(guardado);
    }

    public TransaccionDto obtener(Long id) {
        Transaccion entity = transaccionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaccion no encontrada"));
        return toDto(entity);
    }

    public TransaccionDto actualizar(Long id, Transaccion dto) {
        Transaccion entity = transaccionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaccion no encontrada"));

        if (dto.getTipo_transaccion() == null) {
            throw new IllegalArgumentException("Debe especificarse un tipo de transaccion valido");
        }
        validarTipoAsociado(dto);
        validarMontoContraCosto(dto);

        entity.setIdObra(dto.getIdObra());
        entity.setIdAsociado(dto.getIdAsociado());
        entity.setIdCosto(dto.getIdCosto());
        entity.setTipoAsociado(dto.getTipoAsociado());
        entity.setTipo_transaccion(dto.getTipo_transaccion());
        entity.setFecha(dto.getFecha());
        entity.setMonto(dto.getMonto());
        entity.setForma_pago(dto.getForma_pago());
        entity.setMedio_pago(dto.getMedio_pago());
        entity.setFacturaCobrada(dto.getFacturaCobrada());
        entity.setActivo(dto.getActivo());

        Transaccion guardado = transaccionRepository.save(entity);
        actualizarEstadoCostoDesdeMovimiento(guardado);
        return toDto(guardado);
    }

    public void eliminar(Long id) {
        if (!transaccionRepository.existsById(id)) {
            throw new RuntimeException("La transaccion no existe");
        }
        transaccionRepository.deleteById(id);
    }

    public void eliminarPorCosto(Long idCosto) {
        transaccionRepository.deleteByIdCosto(idCosto);
    }

    @Transactional
    public void desactivarPorObra(Long obraId) {
        transaccionRepository.softDeleteByObraId(obraId);
    }

    @Transactional(readOnly = true)
    public List<TransaccionDto> listarPorObra(Long obraId) {
        return transaccionRepository.findByIdObra(obraId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransaccionDto> findByTipoAsociado(String tipo, Long idAsociado) {
        return transaccionRepository.findByTipoAsociadoAndIdAsociado(tipo, idAsociado)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private TransaccionDto toDto(Transaccion transaccion) {
        if (transaccion == null) return null;

        return TransaccionDto.builder()
                .id(transaccion.getId())
                .id_obra(transaccion.getIdObra())
                .id_asociado(transaccion.getIdAsociado())
                .id_costo(transaccion.getIdCosto())
                .tipo_asociado(transaccion.getTipoAsociado())
                .tipo_transaccion(transaccion.getTipo_transaccion())
                .fecha(transaccion.getFecha())
                .monto(transaccion.getMonto())
                .forma_pago(transaccion.getForma_pago())
                .medio_pago(transaccion.getMedio_pago())
                .factura_cobrada(transaccion.getFacturaCobrada())
                .activo(transaccion.getActivo())
                .ultima_actualizacion(transaccion.getUltimaActualizacion())
                .tipo_actualizacion(transaccion.getTipoActualizacion())
                .build();
    }

    private Long mapTipoTransaccionToId(TipoTransaccionEnum e) {
        return (long) (e.ordinal() + 1);
    }

    private void actualizarEstadoCostoDesdeMovimiento(Transaccion transaccion) {
        if (transaccion == null) return;
        if (transaccion.getIdCosto() == null || transaccion.getIdObra() == null) return;
        if (transaccion.getTipo_transaccion() != TipoTransaccionEnum.PAGO) return;

        try {
            ObraCostoDto costo = obraCostoClient.obtenerCosto(transaccion.getIdObra(), transaccion.getIdCosto());
            if (costo == null || costo.getTotal() == null) return;

            String formaPago = transaccion.getForma_pago() == null
                    ? ""
                    : transaccion.getForma_pago().toUpperCase();
            double totalCosto = costo.getTotal();
            double totalPagos = transaccionRepository.sumarPagosPorCosto(transaccion.getIdCosto());

            String nuevoEstado = null;
            if (totalPagos >= totalCosto) {
                nuevoEstado = "PAGADO";
            } else if (totalPagos > 0) {
                nuevoEstado = "PARCIAL";
            } else if ("PARCIAL".equals(formaPago) || "TOTAL".equals(formaPago)) {
                nuevoEstado = "PENDIENTE";
            }

            if (nuevoEstado == null) return;

            String estadoActual = costo.getEstado_pago() == null
                    ? ""
                    : costo.getEstado_pago().toUpperCase();
            if (estadoActual.equals(nuevoEstado)) return;

            obraCostoClient.actualizarEstadoPago(costo.getId(), nuevoEstado);
        } catch (Exception ex) {
            log.warn("No se pudo actualizar estado de pago del costo {}", transaccion.getIdCosto(), ex);
        }
    }

    private void validarTipoAsociado(Transaccion dto) {
        if (dto == null) return;
        String tipoAsociado = dto.getTipoAsociado() == null ? "" : dto.getTipoAsociado().toUpperCase();
        if ("CLIENTE".equals(tipoAsociado) && dto.getTipo_transaccion() != TipoTransaccionEnum.COBRO) {
            throw new IllegalArgumentException("Para clientes solo se permite COBRO");
        }
        if ("PROVEEDOR".equals(tipoAsociado) && dto.getTipo_transaccion() != TipoTransaccionEnum.PAGO) {
            throw new IllegalArgumentException("Para proveedores solo se permite PAGO");
        }
    }

    private void validarMontoContraCosto(Transaccion dto) {
        if (dto == null) return;
        if (dto.getIdCosto() == null || dto.getIdObra() == null) return;
        if (dto.getTipo_transaccion() != TipoTransaccionEnum.PAGO) return;

        ObraCostoDto costo = obraCostoClient.obtenerCosto(dto.getIdObra(), dto.getIdCosto());
        if (costo == null || costo.getTotal() == null) {
            throw new IllegalArgumentException("Costo no encontrado para validar el monto");
        }

        String formaPago = dto.getForma_pago() == null ? "" : dto.getForma_pago().toUpperCase();
        double monto = dto.getMonto() != null ? dto.getMonto() : 0;
        double totalCosto = costo.getTotal();
        double diferencia = Math.abs(monto - totalCosto);

        if ("TOTAL".equals(formaPago) && diferencia >= 0.01) {
            throw new IllegalArgumentException("Para pago total, el monto debe ser igual al total del costo");
        }
        if ("PARCIAL".equals(formaPago) && monto >= totalCosto) {
            throw new IllegalArgumentException("Para pago parcial, el monto debe ser menor al total del costo");
        }
    }
}
