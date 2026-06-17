package com.clientes.service;

import com.clientes.dto.ClienteRequest;
import com.clientes.dto.ClienteResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ClienteService {
    ClienteResponse crear(ClienteRequest request, Long empresaId);
    ClienteResponse actualizar(Long id, ClienteRequest request);
    ClienteResponse obtener(Long id);
    ClienteResponse obtenerConObras(Long id);
    List<ClienteResponse> listar(Long empresaId);
    Page<ClienteResponse> listarConDetalles(Pageable pageable, Long empresaId);
    List<String> listarCondicionesIva();
    void activar(Long id);
    void desactivar(Long id);
    void eliminar(Long id);
}
