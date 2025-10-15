package com.transacciones.service;

import com.transacciones.dto.TransaccionDto;
import com.transacciones.entity.TipoTransaccion;
import com.transacciones.entity.Transaccion;
import com.transacciones.repository.TipoTransaccionRepository;
import com.transacciones.repository.TransaccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.zip.ZipFile;

@Service
@RequiredArgsConstructor
public class TransaccionService {

    private final TransaccionRepository transaccionRepository;
    private final TipoTransaccionRepository tipoTransaccionRepository;

    public List<Transaccion> listar() {
        return transaccionRepository.findAll();
    }

    public Transaccion crear(Transaccion dto) {
        TipoTransaccion tipo = tipoTransaccionRepository.findById(dto.getTipo_transaccion().getId())
                .orElseThrow(() -> new RuntimeException("Tipo de transacción no encontrado"));

        Transaccion entity = Transaccion.builder()
                .idObra(dto.getIdObra())
                .tipo_transaccion(tipo)
                .fecha(dto.getFecha())
                .monto(dto.getMonto())
                .forma_pago(dto.getForma_pago())
                .activo(dto.getActivo() != null ? dto.getActivo() : true)
                .build();

        return transaccionRepository.save(entity);
    }

    public Transaccion obtener(Long id) {
        return transaccionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transacción no encontrada"));
    }

    public Transaccion actualizar(Long id, Transaccion dto) {
        Transaccion entity = obtener(id);
        TipoTransaccion tipo = tipoTransaccionRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Tipo de transacción no encontrado"));

        entity.setIdObra(dto.getIdObra());
        entity.setTipo_transaccion(tipo);
        entity.setFecha(dto.getFecha());
        entity.setMonto(dto.getMonto());
        entity.setForma_pago(dto.getForma_pago());
        entity.setActivo(dto.getActivo());

        return transaccionRepository.save(entity);
    }

    public void eliminar(Long id) {
        transaccionRepository.deleteById(id);
    }

    public List<Transaccion> listarPorObra(Long obraId) {
        return transaccionRepository.findByIdObra(obraId);
    }
}
