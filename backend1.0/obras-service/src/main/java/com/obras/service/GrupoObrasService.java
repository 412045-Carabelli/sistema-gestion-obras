package com.obras.service;

import com.obras.dto.GrupoObraDTO;
import java.util.List;

public interface GrupoObrasService {
  GrupoObraDTO crear(GrupoObraDTO dto);
  GrupoObraDTO obtenerPorId(Long id);
  List<GrupoObraDTO> listar();
  List<GrupoObraDTO> listarPorCliente(Long idCliente);
  List<GrupoObraDTO> listarActivosPorCliente(Long idCliente);
  GrupoObraDTO actualizar(Long id, GrupoObraDTO dto);
  void eliminar(Long id);
}
