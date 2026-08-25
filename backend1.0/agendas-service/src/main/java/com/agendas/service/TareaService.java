package com.agendas.service;

import com.common.dto.tareas.TareaRequest;
import com.common.dto.tareas.TareaResponse;
import com.common.dto.tareas.TareaAntiguaAgendaResponse;
import java.util.List;

public interface TareaService {
    TareaResponse crear(TareaRequest request, Long organizacionId);
    TareaResponse actualizar(Long id, TareaRequest request);
    TareaResponse obtener(Long id);
    List<TareaResponse> listar(Long organizacionId);
    List<TareaResponse> obtenerTareasPorProveedor(Long proveedorId);
    List<TareaResponse> obtenerTareasPorObra(Long obraId);
    List<TareaResponse> obtenerTareasAntiguasAgenda(int limit);
    List<TareaAntiguaAgendaResponse> obtenerTareasAntiguasAgendaEnriquecidas(int limit, Long organizacionId);
    List<TareaAntiguaAgendaResponse> obtenerVencimientosProximos(
            int dias, Long organizacionId, Long obraId, Long clienteId, Long proveedorId);
    void eliminar(Long id);
    TareaResponse cambiarEstado(Long id, String nuevoEstado);
}
