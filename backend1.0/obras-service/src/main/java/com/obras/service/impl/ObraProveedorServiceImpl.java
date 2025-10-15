package com.obras.service.impl;

import com.obras.entity.ObraProveedor;
import com.obras.repository.ObraProveedorRepository;
import com.obras.service.ObraProveedorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ObraProveedorServiceImpl implements ObraProveedorService {

    private final ObraProveedorRepository obraProveedorRepository;

    @Override
    public void vincularProveedor(Long idObra, Long idProveedor) {
        boolean exists = obraProveedorRepository.existsByIdObraAndIdProveedor(idObra, idProveedor);
        if (!exists) {
            obraProveedorRepository.insertarRelacion(idObra, idProveedor);
        }
    }

    @Override
    public void desvincularProveedor(Long idObra, Long idProveedor) {
        obraProveedorRepository.eliminarRelacion(idObra, idProveedor);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ObraProveedor> proveedoresDeObra(Long idObra) {
        return obraProveedorRepository.findByIdObra(idObra);
    }
}
