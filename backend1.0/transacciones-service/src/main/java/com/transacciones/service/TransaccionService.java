package com.transacciones.service;

import com.transacciones.dto.TipoTransaccionDto;
import com.transacciones.dto.TransaccionDto;
import com.transacciones.entity.TipoTransaccion;
import com.transacciones.entity.Transaccion;
import com.transacciones.repository.TipoTransaccionRepository;
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
    private final TipoTransaccionRepository tipoTransaccionRepository;

    // =========================
    // 📜 Listar todas las transacciones
    // =========================
    public List<TransaccionDto> listar() {
        return transaccionRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // =========================
    // ➕ Crear transacción
    // =========================
    public TransaccionDto crear(Transaccion dto) {
        if (dto.getTipo_transaccion() == null || dto.getTipo_transaccion().getId() == null) {
            throw new IllegalArgumentException("Debe especificarse un tipo de transacción válido");
        }

        TipoTransaccion tipo = tipoTransaccionRepository.findById(dto.getTipo_transaccion().getId())
                .orElseThrow(() -> new RuntimeException("Tipo de transacción no encontrado"));

        Transaccion entity = Transaccion.builder()
                .idObra(dto.getIdObra())
                .idAsociado(dto.getIdAsociado())
                .tipoAsociado(dto.getTipoAsociado())
                .tipo_transaccion(tipo)
                .fecha(dto.getFecha())
                .monto(dto.getMonto())
                .forma_pago(dto.getForma_pago())
                .activo(dto.getActivo() != null ? dto.getActivo() : true)
                .build();

        return toDto(transaccionRepository.save(entity));
    }

    // =========================
    // 🔍 Obtener por ID
    // =========================
    public TransaccionDto obtener(Long id) {
        Transaccion entity = transaccionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transacción no encontrada"));
        return toDto(entity);
    }

    // =========================
    // ✏️ Actualizar transacción
    // =========================
    public TransaccionDto actualizar(Long id, Transaccion dto) {
        Transaccion entity = transaccionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transacción no encontrada"));

        if (dto.getTipo_transaccion() == null || dto.getTipo_transaccion().getId() == null) {
            throw new IllegalArgumentException("Debe especificarse un tipo de transacción válido");
        }

        TipoTransaccion tipo = tipoTransaccionRepository.findById(dto.getTipo_transaccion().getId())
                .orElseThrow(() -> new RuntimeException("Tipo de transacción no encontrado"));

        entity.setIdObra(dto.getIdObra());
        entity.setIdAsociado(dto.getIdAsociado());
        entity.setTipoAsociado(dto.getTipoAsociado());
        entity.setTipo_transaccion(tipo);
        entity.setFecha(dto.getFecha());
        entity.setMonto(dto.getMonto());
        entity.setForma_pago(dto.getForma_pago());
        entity.setActivo(dto.getActivo());

        return toDto(transaccionRepository.save(entity));
    }

    // =========================
    // 🧼 Eliminar transacción
    // =========================
    public void eliminar(Long id) {
        if (!transaccionRepository.existsById(id)) {
            throw new RuntimeException("La transacción no existe");
        }
        transaccionRepository.deleteById(id);
    }

    // =========================
    // 🧾 Listar por obra
    // =========================
    @Transactional(readOnly = true)
    public List<TransaccionDto> listarPorObra(Long obraId) {
        return transaccionRepository.findByIdObra(obraId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // =========================
    // 📌 Buscar por asociado y tipo
    // =========================
    @Transactional(readOnly = true)
    public List<TransaccionDto> findByTipoAsociado(String tipo, Long idAsociado) {
        return transaccionRepository.findByTipoAsociadoAndIdAsociado(tipo, idAsociado)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // =========================
    // 🧭 Mapper a DTO
    // =========================
    private TransaccionDto toDto(Transaccion transaccion) {
        if (transaccion == null) return null;

        return TransaccionDto.builder()
                .id(transaccion.getId())
                .id_obra(transaccion.getIdObra())
                .id_asociado(transaccion.getIdAsociado())
                .tipo_asociado(transaccion.getTipoAsociado())
                .tipo_transaccion(
                        TipoTransaccionDto.builder()
                                .id(transaccion.getTipo_transaccion().getId())
                                .nombre(transaccion.getTipo_transaccion().getNombre())
                                .build()
                )
                .fecha(transaccion.getFecha())
                .monto(transaccion.getMonto())
                .forma_pago(transaccion.getForma_pago())
                .build();
    }
}
