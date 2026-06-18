package com.obras.service.impl;

import com.obras.dto.GrupoObraDTO;
import com.obras.entity.GrupoObra;
import com.obras.repository.GrupoObrasRepository;
import com.obras.service.GrupoObrasService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class GrupoObrasServiceImpl implements GrupoObrasService {

  private final GrupoObrasRepository repository;

  @Override
  public GrupoObraDTO crear(GrupoObraDTO dto, Long organizacionId) {
    if (dto.getId_cliente() == null) {
      throw new IllegalArgumentException("id_cliente es requerido");
    }
    if (dto.getNombre() == null || dto.getNombre().isBlank()) {
      throw new IllegalArgumentException("nombre es requerido");
    }

    GrupoObra grupo = new GrupoObra();
    grupo.setOrganizacionId(organizacionId != null ? organizacionId : 0L);
    grupo.setIdCliente(dto.getId_cliente());
    grupo.setNombre(dto.getNombre());
    grupo.setActivo(Boolean.TRUE);

    GrupoObra saved = repository.save(grupo);
    return toDTO(saved);
  }

  @Override
  @Transactional(readOnly = true)
  public GrupoObraDTO obtenerPorId(Long id) {
    return repository.findById(id)
        .map(this::toDTO)
        .orElseThrow(() -> new RuntimeException("Grupo de obra " + id + " no existe"));
  }

  @Override
  @Transactional(readOnly = true)
  public List<GrupoObraDTO> listar(Long organizacionId) {
    List<GrupoObra> grupos = (organizacionId != null && organizacionId > 0)
        ? repository.findByOrganizacionId(organizacionId)
        : repository.findAll();
    return grupos.stream().map(this::toDTO).toList();
  }

  @Override
  @Transactional(readOnly = true)
  public List<GrupoObraDTO> listarPorCliente(Long idCliente, Long organizacionId) {
    List<GrupoObra> grupos = (organizacionId != null && organizacionId > 0)
        ? repository.findByIdClienteAndOrganizacionId(idCliente, organizacionId)
        : repository.findByIdCliente(idCliente);
    return grupos.stream().map(this::toDTO).toList();
  }

  @Override
  @Transactional(readOnly = true)
  public List<GrupoObraDTO> listarActivosPorCliente(Long idCliente, Long organizacionId) {
    List<GrupoObra> grupos = (organizacionId != null && organizacionId > 0)
        ? repository.findByIdClienteAndActivoTrueAndOrganizacionId(idCliente, organizacionId)
        : repository.findByIdClienteAndActivoTrue(idCliente);
    return grupos.stream().map(this::toDTO).toList();
  }

  @Override
  public GrupoObraDTO actualizar(Long id, GrupoObraDTO dto) {
    GrupoObra grupo = repository.findById(id)
        .orElseThrow(() -> new RuntimeException("Grupo de obra " + id + " no existe"));

    grupo.setNombre(dto.getNombre());
    grupo.setActivo(dto.getActivo() != null ? dto.getActivo() : Boolean.TRUE);

    GrupoObra updated = repository.save(grupo);
    return toDTO(updated);
  }

  @Override
  public void eliminar(Long id) {
    GrupoObra grupo = repository.findById(id)
        .orElseThrow(() -> new RuntimeException("Grupo de obra " + id + " no existe"));
    repository.delete(grupo);
    log.info("Grupo de obra {} eliminado", id);
  }

  private GrupoObraDTO toDTO(GrupoObra grupo) {
    GrupoObraDTO dto = new GrupoObraDTO();
    dto.setId(grupo.getId());
    dto.setId_cliente(grupo.getIdCliente());
    dto.setNombre(grupo.getNombre());
    dto.setActivo(grupo.getActivo());
    dto.setCreado_en(grupo.getCreadoEn());
    dto.setUltima_actualizacion(grupo.getUltimaActualizacion());
    dto.setTipo_actualizacion(grupo.getTipoActualizacion());
    return dto;
  }
}
