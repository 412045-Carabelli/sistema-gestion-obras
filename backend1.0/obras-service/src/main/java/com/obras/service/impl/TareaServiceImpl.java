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
        Tarea t = toEntity(dto);
        t.setActivo(true);
        t.setCreadoEn(Instant.now());
        t = tareaRepo.save(t);
        return toDto(t);
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
            tareaRepo.save(t);
        });
    }

    @Transactional(readOnly = true)
    @Override
    public List<TareaDTO> tareasDeObra(Long idObra) {
        return tareaRepo.findByIdObraAndActivoTrue(idObra)
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
        dto.setNombre(entity.getNombre());
        dto.setDescripcion(entity.getDescripcion());
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
        entity.setNombre(dto.getNombre());
        entity.setDescripcion(dto.getDescripcion());
        entity.setFechaInicio(dto.getFecha_inicio());
        entity.setFechaFin(dto.getFecha_fin());
        entity.setActivo(dto.getActivo() != null ? dto.getActivo() : Boolean.TRUE);

        if (dto.getEstado_tarea() != null) {
            entity.setEstadoTarea(dto.getEstado_tarea());
        }
        return entity;
    }
}
