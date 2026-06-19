package com.obras.service;

import com.obras.dto.GrupoObraDTO;
import java.util.List;

public interface GrupoObrasService {
  GrupoObraDTO crear(GrupoObraDTO dto, Long organizacionId);
  GrupoObraDTO obtenerPorId(Long id);
  List<GrupoObraDTO> listar(Long organizacionId);
  List<GrupoObraDTO> listarPorCliente(Long idCliente, Long organizacionId);
  List<GrupoObraDTO> listarActivosPorCliente(Long idCliente, Long organizacionId);
  GrupoObraDTO actualizar(Long id, GrupoObraDTO dto);
  void eliminar(Long id);
}
