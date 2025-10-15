package com.obras.service;

import com.obras.entity.ObraProveedor;
import org.springframework.stereotype.Service;

import java.util.List;

public interface ObraProveedorService {
    void vincularProveedor(Long idObra, Long idProveedor);
    void desvincularProveedor(Long idObra, Long idProveedor);
    List<ObraProveedor> proveedoresDeObra(Long idObra);
}

