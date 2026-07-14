package com.obras.service;

import com.obras.dto.*;
import com.obras.entity.ObraProveedor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.*;

public interface ObraService {
    ObraDTO crear(ObraDTO dto);
    Optional<ObraDTO> obtener(Long id);
    Page<ObraDTO> listar(Long organizacionId, Pageable p);
    Page<ObraDTO> listarPorCliente(Long idCliente, Long organizacionId, Pageable p);
    Page<ObraListDTO> listarResumen(Pageable p, com.obras.enums.EstadoObraEnum estado, Boolean activo, String q, Long organizacionId);
    ObraDTO actualizar(Long id, ObraDTO dto);
    Optional<ObraDTO> obtenerUltimaCondicion();
    void cambiarEstado(Long idObra, com.obras.enums.EstadoObraEnum estado);
    void activar(Long idObra);

    // Filtros en cascada
    List<Map<String, Object>> obtenerObrasPorProveedor(Long proveedorId);
    List<Map<String, Object>> obtenerClientesPorProveedor(Long proveedorId);
    List<Map<String, Object>> obtenerObrasPorCliente(Long clienteId);
    List<Map<String, Object>> obtenerProveedoresPorObra(Long obraId);
}
