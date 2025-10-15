package com.transacciones.service;

import com.transacciones.entity.TipoTransaccion;
import com.transacciones.repository.TipoTransaccionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TipoTransaccionService {

    private final TipoTransaccionRepository tipoTransaccionRepository;

    public List<TipoTransaccion> listar() {
        return tipoTransaccionRepository.findAll();
    }

    public TipoTransaccion crear(TipoTransaccion tipo) {
        return tipoTransaccionRepository.save(tipo);
    }

    public TipoTransaccion obtener(Long id) {
        return tipoTransaccionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tipo no encontrado"));
    }
}
