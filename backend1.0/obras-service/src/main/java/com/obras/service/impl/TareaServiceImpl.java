package com.obras.service.impl;

import com.obras.dto.TareaDTO;
import com.obras.entity.Tarea;
import com.obras.enums.EstadoTareaEnum;
import com.obras.repository.TareaRepository;
import com.obras.service.TareaService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TareaServiceImpl implements TareaService {

    private final TareaRepository tareaRepo;

    @Override
    public TareaDTO crear(TareaDTO dto) {
        if (dto.getNumero_orden() == null) {
            dto.setNumero_orden(siguienteNumeroOrden(dto.getId_obra()));
        }
        validarPorcentaje(dto.getPorcentaje(), dto.getId_obra(), dto.getId_proveedor(), null);
        validarNumeroOrden(dto.getNumero_orden(), dto.getId_obra(), null);
        Tarea t = toEntity(dto);
        t.setActivo(true);
        t.setBajaObra(Boolean.FALSE);
        t.setCreadoEn(Instant.now());
        t = tareaRepo.save(t);
        return toDto(t);
    }

    @Override
    public TareaDTO actualizar(Long id, TareaDTO dto) {
        Tarea existente = tareaRepo.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new EntityNotFoundException("Tarea no encontrada"));
        dto.setId(id);
        dto.setId_obra(existente.getIdObra());
        if (dto.getNumero_orden() == null) {
            dto.setNumero_orden(existente.getNumeroOrden());
        }
        validarPorcentaje(dto.getPorcentaje(), existente.getIdObra(), dto.getId_proveedor(), id);
        validarNumeroOrden(dto.getNumero_orden(), existente.getIdObra(), id);

        Tarea entity = toEntity(dto);
        entity.setCreadoEn(existente.getCreadoEn());
        entity.setActivo(existente.getActivo());
        return toDto(tareaRepo.save(entity));
    }

    @Override
    public TareaDTO completarTarea(Long id) {
        Tarea tarea = tareaRepo.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new RuntimeException("Tarea no encontrada"));

        EstadoTareaEnum nuevo = (tarea.getEstadoTarea() == EstadoTareaEnum.COMPLETADA)
                ? EstadoTareaEnum.PENDIENTE
                : EstadoTareaEnum.COMPLETADA;

        tarea.setEstadoTarea(nuevo);
        return toDto(tareaRepo.save(tarea));
    }

    @Override
    public void borrar(Long id) {
        tareaRepo.findByIdAndActivoTrue(id).ifPresent(t -> {
            t.setActivo(false);
            t.setBajaObra(Boolean.FALSE);
            tareaRepo.save(t);
        });
    }

    @Transactional(readOnly = true)
    @Override
    public List<TareaDTO> tareasDeObra(Long idObra) {
        return tareaRepo.findByIdObraAndActivoTrueOrderByNumeroOrdenAscFechaInicioAscCreadoEnAsc(idObra)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // 🆕 NUEVO MÉTODO - tareas por proveedor
    @Transactional(readOnly = true)
    @Override
    public List<TareaDTO> tareasDeProveedor(Long idProveedor) {
        return tareaRepo.findByIdProveedorAndActivoTrue(idProveedor)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private TareaDTO toDto(Tarea entity) {
        TareaDTO dto = new TareaDTO();
        dto.setId(entity.getId());
        dto.setId_obra(entity.getIdObra());
        dto.setId_proveedor(entity.getIdProveedor());
        dto.setNumero_orden(entity.getNumeroOrden());
        dto.setNombre(entity.getNombre());
        dto.setDescripcion(entity.getDescripcion());
        dto.setPorcentaje(entity.getPorcentaje());
        dto.setFecha_inicio(entity.getFechaInicio());
        dto.setFecha_fin(entity.getFechaFin());
        dto.setCreado_en(entity.getCreadoEn());
        dto.setActivo(entity.getActivo());
        dto.setUltima_actualizacion(entity.getUltimaActualizacion());
        dto.setTipo_actualizacion(entity.getTipoActualizacion());

        if (entity.getEstadoTarea() != null) {
            dto.setEstado_tarea(entity.getEstadoTarea());
        }
        return dto;
    }

    private Tarea toEntity(TareaDTO dto) {
        Tarea entity = new Tarea();
        entity.setId(dto.getId());
        entity.setIdObra(dto.getId_obra());
        entity.setIdProveedor(dto.getId_proveedor());
        entity.setNumeroOrden(dto.getNumero_orden());
        entity.setNombre(dto.getNombre());
        entity.setDescripcion(dto.getDescripcion());
        entity.setPorcentaje(dto.getPorcentaje() != null ? dto.getPorcentaje() : 0d);
        entity.setFechaInicio(dto.getFecha_inicio());
        entity.setFechaFin(dto.getFecha_fin());
        entity.setActivo(dto.getActivo() != null ? dto.getActivo() : Boolean.TRUE);
        entity.setBajaObra(Boolean.FALSE);

        if (dto.getEstado_tarea() != null) {
            entity.setEstadoTarea(dto.getEstado_tarea());
        } else {
            entity.setEstadoTarea(EstadoTareaEnum.PENDIENTE);
        }
        return entity;
    }

    private void validarPorcentaje(Double porcentaje, Long idObra, Long idProveedor, Long excluirId) {
        double valor = porcentaje != null ? porcentaje : 0d;
        if (valor < 0 || valor > 100) {
            throw new IllegalArgumentException("El porcentaje debe estar entre 0 y 100");
        }
        if (idProveedor == null || idObra == null) {
            return;
        }
        Double sumaActual = tareaRepo.sumPorcentajeByObraProveedorExcluyendo(idObra, idProveedor, excluirId);
        double actual = sumaActual != null ? sumaActual : 0d;
        if (actual + valor > 100 + 1e-6) {
            throw new IllegalArgumentException("La suma de porcentajes de tareas del proveedor no puede superar 100%");
        }
    }

    private void validarNumeroOrden(Long numeroOrden, Long idObra, Long excluirId) {
        if (numeroOrden == null || idObra == null) return;
        if (numeroOrden <= 0) {
            throw new IllegalArgumentException("El numero de orden debe ser mayor a 0");
        }
        long repetidos = (excluirId == null)
                ? tareaRepo.countByIdObraAndNumeroOrdenAndActivoTrue(idObra, numeroOrden)
                : tareaRepo.countByIdObraAndNumeroOrdenAndIdNotAndActivoTrue(idObra, numeroOrden, excluirId);
        if (repetidos > 0) {
            throw new IllegalArgumentException("Ya existe una tarea con ese numero de orden en la obra");
        }
    }

    private Long siguienteNumeroOrden(Long idObra) {
        if (idObra == null) return 1L;
        Long max = tareaRepo.maxNumeroOrdenByObra(idObra);
        if (max == null || max < 1) {
            return 1L;
        }
        return max + 1;
    }
}
