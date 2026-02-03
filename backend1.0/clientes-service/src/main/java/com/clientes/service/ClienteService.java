package com.clientes.service;

import com.clientes.dto.ClienteRequest;
import com.clientes.dto.ClienteResponse;

import java.util.List;

public interface ClienteService {
    ClienteResponse crear(ClienteRequest request);
    ClienteResponse actualizar(Long id, ClienteRequest request);
    ClienteResponse obtener(Long id);
    ClienteResponse obtenerConObras(Long id);
    List<ClienteResponse> listar();
    List<String> listarCondicionesIva();
    void activar(Long id);
    void desactivar(Long id);
    void eliminar(Long id);
}
