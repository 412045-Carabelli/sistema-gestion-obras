package com.transacciones.service;

import com.transacciones.dto.TransaccionDto;
import com.transacciones.entity.Transaccion;
import com.transacciones.enums.TipoTransaccionEnum;
import com.transacciones.repository.TransaccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransaccionService {

    private final TransaccionRepository transaccionRepository;

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

        return toDto(transaccionRepository.save(entity));
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

        return toDto(transaccionRepository.save(entity));
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
}
