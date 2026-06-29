package com.agendas.service.impl;

import com.common.dto.tareas.TareaRequest;
import com.common.dto.tareas.TareaResponse;
import com.common.dto.tareas.TareaAntiguaAgendaResponse;
import com.agendas.dto.external.ObraExternalDto;
import com.agendas.dto.external.ClienteExternalDto;
import com.agendas.dto.external.ProveedorExternalDto;
import com.agendas.entity.EstadoTarea;
import com.agendas.entity.Tarea;
import com.agendas.exception.TareaNotFoundException;
import com.agendas.repository.TareaRepository;
import com.agendas.service.TareaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

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
    private final RestTemplate restTemplate;

    @Value("${services.obras.url:http://obras-service:8081}")
    private String obrasServiceUrl;

    @Value("${services.clientes.url:http://clientes-service:8082}")
    private String clientesServiceUrl;

    @Value("${services.proveedores.url:http://proveedores-service:8083}")
    private String proveedoresServiceUrl;

    @Override
    public TareaResponse crear(TareaRequest request, Long organizacionId) {
        validarEstado(request.getEstado());
        Tarea entity = mapearEntidad(request);
        entity.setOrganizacionId(organizacionId);
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
    public List<TareaResponse> listar(Long organizacionId) {
        List<Tarea> tareas = organizacionId != null
            ? repository.findByOrganizacionIdOrderByCreadoEnAsc(organizacionId)
            : repository.findAll();
        return tareas.stream()
                .map(this::mapearRespuesta)
                .toList();
    }

    @Override
    public List<TareaResponse> obtenerTareasPorProveedor(Long proveedorId) {
        return repository.findByProveedorId(proveedorId).stream()
                .map(this::mapearRespuesta)
                .toList();
    }

    @Override
    public List<TareaResponse> obtenerTareasAntiguasAgenda(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return repository.findAllByOrderByCreadoEnAsc(pageable).stream()
                .map(this::mapearRespuesta)
                .toList();
    }

    @Override
    public List<TareaAntiguaAgendaResponse> obtenerTareasAntiguasAgendaEnriquecidas(int limit, Long organizacionId) {
        Pageable pageable = PageRequest.of(0, limit);
        List<Tarea> tareas = (organizacionId != null && organizacionId > 0)
                ? repository.findByOrganizacionIdOrderByCreadoEnAsc(organizacionId, pageable)
                : repository.findAllByOrderByCreadoEnAsc(pageable);
        return tareas.stream()
                .map(this::mapearRespuestaEnriquecida)
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
        tarea.setFechaInicio(request.getFechaInicio());
        tarea.setFechaVencimiento(request.getFechaVencimiento());
        tarea.setPrioridad(request.getPrioridad() != null ? request.getPrioridad().toUpperCase() : "MEDIA");
        return tarea;
    }

    private void actualizarEntidad(Tarea tarea, TareaRequest request) {
        tarea.setTitulo(request.getTitulo());
        tarea.setObraId(request.getObraId());
        tarea.setClienteId(request.getClienteId());
        tarea.setProveedorId(request.getProveedorId());
        tarea.setEstado(ESTADOS_VALIDOS.get(request.getEstado().toUpperCase()));
        tarea.setDescripcion(request.getDescripcion());
        tarea.setFechaInicio(request.getFechaInicio());
        tarea.setFechaVencimiento(request.getFechaVencimiento());
        tarea.setPrioridad(request.getPrioridad() != null ? request.getPrioridad().toUpperCase() : "MEDIA");
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
        response.setFechaInicio(tarea.getFechaInicio());
        response.setFechaVencimiento(tarea.getFechaVencimiento());
        response.setCreadoEn(tarea.getCreadoEn());
        response.setUltimaActualizacion(tarea.getUltimaActualizacion());
        response.setPrioridad(tarea.getPrioridad());
        return response;
    }

    private void validarEstado(String estado) {
        if (!ESTADOS_VALIDOS.containsKey(estado.toUpperCase())) {
            throw new IllegalArgumentException("Estado inválido: " + estado);
        }
    }

    private TareaAntiguaAgendaResponse mapearRespuestaEnriquecida(Tarea tarea) {
        TareaAntiguaAgendaResponse response = new TareaAntiguaAgendaResponse();
        response.setId(tarea.getId());
        response.setTitulo(tarea.getTitulo());
        response.setObraId(tarea.getObraId());
        response.setClienteId(tarea.getClienteId());
        response.setProveedorId(tarea.getProveedorId());
        response.setEstado(tarea.getEstado().name());
        response.setDescripcion(tarea.getDescripcion());
        response.setFechaInicio(tarea.getFechaInicio());
        response.setFechaVencimiento(tarea.getFechaVencimiento());
        response.setCreadoEn(tarea.getCreadoEn());
        response.setUltimaActualizacion(tarea.getUltimaActualizacion());
        response.setPrioridad(tarea.getPrioridad());

        // Enriquecer con nombres
        if (tarea.getObraId() != null) {
            response.setObraNombre(obtenerNombreObra(tarea.getObraId()));
        }
        if (tarea.getClienteId() != null) {
            response.setClienteNombre(obtenerNombreCliente(tarea.getClienteId()));
        }
        if (tarea.getProveedorId() != null) {
            response.setProveedorNombre(obtenerNombreProveedor(tarea.getProveedorId()));
        }

        return response;
    }

    private String obtenerNombreObra(Long obraId) {
        try {
            ObraExternalDto response = restTemplate.getForObject(
                    obrasServiceUrl + "/api/obras/{id}",
                    ObraExternalDto.class,
                    obraId
            );
            return response != null ? response.getNombre() : null;
        } catch (RestClientException e) {
            log.warn("No se pudo obtener nombre de obra {}: {}", obraId, e.getMessage());
            return null;
        }
    }

    private String obtenerNombreCliente(Long clienteId) {
        try {
            ClienteExternalDto response = restTemplate.getForObject(
                    clientesServiceUrl + "/api/clientes/{id}",
                    ClienteExternalDto.class,
                    clienteId
            );
            return response != null ? response.getNombre() : null;
        } catch (RestClientException e) {
            log.warn("No se pudo obtener nombre de cliente {}: {}", clienteId, e.getMessage());
            return null;
        }
    }

    private String obtenerNombreProveedor(Long proveedorId) {
        try {
            ProveedorExternalDto response = restTemplate.getForObject(
                    proveedoresServiceUrl + "/api/proveedores/{id}",
                    ProveedorExternalDto.class,
                    proveedorId
            );
            return response != null ? response.getNombre() : null;
        } catch (RestClientException e) {
            log.warn("No se pudo obtener nombre de proveedor {}: {}", proveedorId, e.getMessage());
            return null;
        }
    }
}
