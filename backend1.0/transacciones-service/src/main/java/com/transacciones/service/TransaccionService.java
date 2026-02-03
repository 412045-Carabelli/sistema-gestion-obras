package com.transacciones.service;

import com.transacciones.dto.ObraCostoDto;
import com.transacciones.dto.ObraResumenDto;
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
import java.util.Optional;
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
        validarMontoContraPresupuesto(dto);

        Transaccion entity = Transaccion.builder()
                .idObra(dto.getIdObra())
                .idAsociado(dto.getIdAsociado())
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
        validarMontoContraPresupuesto(dto, entity);

        entity.setIdObra(dto.getIdObra());
        entity.setIdAsociado(dto.getIdAsociado());
        entity.setTipoAsociado(dto.getTipoAsociado());
        entity.setTipo_transaccion(dto.getTipo_transaccion());
        entity.setFecha(dto.getFecha());
        entity.setMonto(dto.getMonto());
        entity.setForma_pago(dto.getForma_pago());
        entity.setMedio_pago(dto.getMedio_pago());
        entity.setFacturaCobrada(dto.getFacturaCobrada());
        entity.setActivo(dto.getActivo());

        Transaccion guardado = transaccionRepository.save(entity);
        return toDto(guardado);
    }

    public void eliminar(Long id) {
        if (!transaccionRepository.existsById(id)) {
            throw new RuntimeException("La transaccion no existe");
        }
        transaccionRepository.deleteById(id);
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

        TransaccionDto dto = TransaccionDto.builder()
                .id(transaccion.getId())
                .id_obra(transaccion.getIdObra())
                .id_asociado(transaccion.getIdAsociado())
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

        completarPagadoRestante(transaccion, dto);
        return dto;
    }

    private void completarPagadoRestante(Transaccion transaccion, TransaccionDto dto) {
        if (transaccion == null || dto == null) return;
        if (transaccion.getTipo_transaccion() == null) return;

        String tipoAsociado = transaccion.getTipoAsociado() == null ? "" : transaccion.getTipoAsociado().toUpperCase();
        if (transaccion.getTipo_transaccion() == TipoTransaccionEnum.COBRO
                && "CLIENTE".equals(tipoAsociado)
                && transaccion.getIdObra() != null) {
            try {
                ObraResumenDto obra = obraCostoClient.obtenerObra(transaccion.getIdObra());
                if (obra == null || obra.getPresupuesto() == null) return;
                Double cobrado = transaccionRepository.sumarCobrosPorObra(transaccion.getIdObra());
                double cobradoVal = cobrado != null ? cobrado : 0d;
                dto.setPagado(cobradoVal);
                dto.setRestante(Math.max(0d, obra.getPresupuesto() - cobradoVal));
            } catch (Exception ex) {
                log.debug("No se pudo calcular pagado/restante para obra {}", transaccion.getIdObra(), ex);
            }
        }
    }

    private Long mapTipoTransaccionToId(TipoTransaccionEnum e) {
        return (long) (e.ordinal() + 1);
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

    private void validarMontoContraPresupuesto(Transaccion dto) {
        validarMontoContraPresupuesto(dto, null);
    }

    private void validarMontoContraPresupuesto(Transaccion dto, Transaccion existente) {
        if (dto == null) return;
        if (dto.getIdObra() == null) return;

        String tipoAsociado = dto.getTipoAsociado() == null ? "" : dto.getTipoAsociado().toUpperCase();
        String formaPago = dto.getForma_pago() == null ? "" : dto.getForma_pago().toUpperCase();
        if (!"TOTAL".equals(formaPago) && !"PARCIAL".equals(formaPago)) {
            throw new IllegalArgumentException("Debe especificarse la condicion de pago (TOTAL o PARCIAL)");
        }

        if ("CLIENTE".equals(tipoAsociado) && dto.getTipo_transaccion() == TipoTransaccionEnum.COBRO) {
            validarMontoCobroCliente(dto, existente, formaPago);
            return;
        }

        if ("PROVEEDOR".equals(tipoAsociado) && dto.getTipo_transaccion() == TipoTransaccionEnum.PAGO) {
            validarMontoPagoProveedor(dto, existente, formaPago);
        }
    }

    private void validarMontoCobroCliente(Transaccion dto, Transaccion existente, String formaPago) {

        ObraResumenDto obra = obraCostoClient.obtenerObra(dto.getIdObra());
        if (obra == null || obra.getPresupuesto() == null) {
            throw new IllegalArgumentException("Presupuesto de la obra no encontrado para validar el cobro");
        }
        validarEstadoObra(obra);

        double monto = dto.getMonto() != null ? dto.getMonto() : 0;
        double presupuesto = obra.getPresupuesto();
        double cobrosPrevios = Optional.ofNullable(transaccionRepository.sumarCobrosPorObra(dto.getIdObra()))
                .orElse(0d);
        if (existente != null
                && existente.getIdObra() != null
                && existente.getIdObra().equals(dto.getIdObra())
                && existente.getTipo_transaccion() == TipoTransaccionEnum.COBRO
                && "CLIENTE".equalsIgnoreCase(existente.getTipoAsociado())) {
            cobrosPrevios -= Optional.ofNullable(existente.getMonto()).orElse(0d);
        }
        double totalDespues = cobrosPrevios + monto;
        double diferencia = Math.abs(totalDespues - presupuesto);
        double restante = Math.max(0d, presupuesto - cobrosPrevios);

        if (monto - restante > 0.01) {
            throw new IllegalArgumentException("El monto no puede superar el restante de la obra");
        }
        if ("TOTAL".equals(formaPago) && diferencia >= 0.01) {
            throw new IllegalArgumentException("Para cobro total, el monto debe completar el presupuesto total de la obra");
        }
        if ("PARCIAL".equals(formaPago) && totalDespues >= presupuesto) {
            throw new IllegalArgumentException("Para cobro parcial, el monto no debe completar el presupuesto total de la obra");
        }
    }

    private void validarMontoPagoProveedor(Transaccion dto, Transaccion existente, String formaPago) {
        if (dto.getIdAsociado() == null) return;

        ObraResumenDto obra = obraCostoClient.obtenerObra(dto.getIdObra());
        if (obra == null) {
            throw new IllegalArgumentException("Obra no encontrada para validar el pago");
        }
        validarEstadoObra(obra);

        List<ObraCostoDto> costos = obraCostoClient.obtenerCostos(dto.getIdObra());
        double totalProveedor = costos.stream()
                .filter(c -> c != null && c.getId_proveedor() != null)
                .filter(c -> c.getId_proveedor().equals(dto.getIdAsociado()))
                .mapToDouble(this::getMontoBaseCosto)
                .sum();

        double pagosPrevios = transaccionRepository
                .findByIdObraAndTipoAsociadoAndIdAsociado(dto.getIdObra(), "PROVEEDOR", dto.getIdAsociado())
                .stream()
                .filter(t -> t.getTipo_transaccion() == TipoTransaccionEnum.PAGO)
                .mapToDouble(t -> Optional.ofNullable(t.getMonto()).orElse(0d))
                .sum();

        if (existente != null
                && existente.getIdObra() != null
                && existente.getIdObra().equals(dto.getIdObra())
                && existente.getTipo_transaccion() == TipoTransaccionEnum.PAGO
                && "PROVEEDOR".equalsIgnoreCase(existente.getTipoAsociado())
                && existente.getIdAsociado() != null
                && existente.getIdAsociado().equals(dto.getIdAsociado())) {
            pagosPrevios -= Optional.ofNullable(existente.getMonto()).orElse(0d);
        }

        double restante = Math.max(0d, totalProveedor - pagosPrevios);
        double monto = dto.getMonto() != null ? dto.getMonto() : 0d;
        double diferencia = Math.abs(monto - restante);

        if (monto - restante > 0.01) {
            throw new IllegalArgumentException("El monto no puede superar el saldo del proveedor");
        }
        if ("TOTAL".equals(formaPago) && diferencia >= 0.01) {
            throw new IllegalArgumentException("Para pago total, el monto debe completar el saldo del proveedor");
        }
        if ("PARCIAL".equals(formaPago) && monto >= restante) {
            throw new IllegalArgumentException("Para pago parcial, el monto debe ser menor al saldo del proveedor");
        }
    }

    private double getMontoBaseCosto(ObraCostoDto costo) {
        if (costo == null) return 0d;
        if (costo.getSubtotal() != null) return costo.getSubtotal();
        double cantidad = costo.getCantidad() != null ? costo.getCantidad() : 0d;
        double precio = costo.getPrecio_unitario() != null ? costo.getPrecio_unitario() : 0d;
        return cantidad * precio;
    }

    private void validarEstadoObra(ObraResumenDto obra) {
        String estado = obra.getObra_estado() == null ? "" : obra.getObra_estado().trim().toUpperCase().replaceAll("\\s+", "_");
        if (!"ADJUDICADA".equals(estado) && !"EN_PROGRESO".equals(estado) && !"FINALIZADA".equals(estado)) {
            throw new IllegalArgumentException("La obra debe estar Adjudicada, En progreso o Finalizada para registrar movimientos");
        }
    }
}
