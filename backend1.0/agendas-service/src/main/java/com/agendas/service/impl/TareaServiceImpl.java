package com.agendas.service.impl;

import com.common.dto.tareas.TareaRequest;
import com.common.dto.tareas.TareaResponse;
import com.agendas.entity.EstadoTarea;
import com.agendas.entity.Tarea;
import com.agendas.exception.TareaNotFoundException;
import com.agendas.repository.TareaRepository;
import com.agendas.service.TareaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TareaServiceImpl implements TareaService {

    private static final Map<String, EstadoTarea> ESTADOS_VALIDOS = Map.of(
            "PENDIENTE", EstadoTarea.PENDIENTE,
            "EN_PROGRESO", EstadoTarea.EN_PROGRESO,
            "COMPLETADA", EstadoTarea.COMPLETADA
    );

    private final TareaRepository repository;

    @Override
    public TareaResponse crear(TareaRequest request) {
        validarEstado(request.getEstado());
        Tarea entity = mapearEntidad(request);
        Tarea guardada = repository.save(entity);
        return mapearRespuesta(guardada);
    }

    @Override
    public TareaResponse actualizar(Long id, TareaRequest request) {
        validarEstado(request.getEstado());
        Tarea existente = repository.findById(id)
                .orElseThrow(() -> new TareaNotFoundException(id));
        actualizarEntidad(existente, request);
        Tarea guardada = repository.save(existente);
        return mapearRespuesta(guardada);
    }

    @Override
    public TareaResponse obtener(Long id) {
        Tarea tarea = repository.findById(id)
                .orElseThrow(() -> new TareaNotFoundException(id));
        return mapearRespuesta(tarea);
    }

    @Override
    public List<TareaResponse> listar() {
        return repository.findAll().stream()
                .map(this::mapearRespuesta)
                .toList();
    }

    @Override
    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new TareaNotFoundException(id);
        }
        repository.deleteById(id);
    }

    @Override
    public TareaResponse cambiarEstado(Long id, String nuevoEstado) {
        validarEstado(nuevoEstado);
        Tarea existente = repository.findById(id)
                .orElseThrow(() -> new TareaNotFoundException(id));
        existente.setEstado(ESTADOS_VALIDOS.get(nuevoEstado.toUpperCase()));
        Tarea guardada = repository.save(existente);
        return mapearRespuesta(guardada);
    }

    private Tarea mapearEntidad(TareaRequest request) {
        Tarea tarea = new Tarea();
        tarea.setTitulo(request.getTitulo());
        tarea.setObraId(request.getObraId());
        tarea.setClienteId(request.getClienteId());
        tarea.setProveedorId(request.getProveedorId());
        tarea.setEstado(ESTADOS_VALIDOS.get(request.getEstado().toUpperCase()));
        tarea.setDescripcion(request.getDescripcion());
        tarea.setFechaVencimiento(request.getFechaVencimiento());
        return tarea;
    }

    private void actualizarEntidad(Tarea tarea, TareaRequest request) {
        tarea.setTitulo(request.getTitulo());
        tarea.setObraId(request.getObraId());
        tarea.setClienteId(request.getClienteId());
        tarea.setProveedorId(request.getProveedorId());
        tarea.setEstado(ESTADOS_VALIDOS.get(request.getEstado().toUpperCase()));
        tarea.setDescripcion(request.getDescripcion());
        tarea.setFechaVencimiento(request.getFechaVencimiento());
    }

    private TareaResponse mapearRespuesta(Tarea tarea) {
        TareaResponse response = new TareaResponse();
        response.setId(tarea.getId());
        response.setTitulo(tarea.getTitulo());
        response.setObraId(tarea.getObraId());
        response.setClienteId(tarea.getClienteId());
        response.setProveedorId(tarea.getProveedorId());
        response.setEstado(tarea.getEstado().name());
        response.setDescripcion(tarea.getDescripcion());
        response.setFechaVencimiento(tarea.getFechaVencimiento());
        response.setCreadoEn(tarea.getCreadoEn());
        response.setUltimaActualizacion(tarea.getUltimaActualizacion());
        return response;
    }

    private void validarEstado(String estado) {
        if (!ESTADOS_VALIDOS.containsKey(estado.toUpperCase())) {
            throw new IllegalArgumentException("Estado inválido: " + estado);
        }
    }
}
