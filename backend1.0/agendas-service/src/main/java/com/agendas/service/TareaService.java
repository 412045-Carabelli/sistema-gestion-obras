package com.agendas.service;

import com.common.dto.tareas.TareaRequest;
import com.common.dto.tareas.TareaResponse;
import java.util.List;

public interface TareaService {
    TareaResponse crear(TareaRequest request);
    TareaResponse actualizar(Long id, TareaRequest request);
    TareaResponse obtener(Long id);
    List<TareaResponse> listar();
    void eliminar(Long id);
    TareaResponse cambiarEstado(Long id, String nuevoEstado);
}
