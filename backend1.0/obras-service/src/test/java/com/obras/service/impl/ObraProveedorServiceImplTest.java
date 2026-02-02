package com.obras.service.impl;

import com.obras.entity.ObraProveedor;
import com.obras.repository.ObraProveedorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ObraProveedorServiceImplTest {

    @Mock
    private ObraProveedorRepository obraProveedorRepository;

    @InjectMocks
    private ObraProveedorServiceImpl service;

    @Test
    void vincular_proveedor_inserta_si_no_existe() {
        when(obraProveedorRepository.existsByIdObraAndIdProveedor(1L, 2L)).thenReturn(false);

        service.vincularProveedor(1L, 2L);

        verify(obraProveedorRepository).insertarRelacion(1L, 2L);
    }

    @Test
    void vincular_proveedor_no_inserta_si_existe() {
        when(obraProveedorRepository.existsByIdObraAndIdProveedor(1L, 2L)).thenReturn(true);

        service.vincularProveedor(1L, 2L);

        verify(obraProveedorRepository, never()).insertarRelacion(anyLong(), anyLong());
    }

    @Test
    void desvincular_proveedor_elimina_relacion() {
        service.desvincularProveedor(3L, 4L);

        verify(obraProveedorRepository).eliminarRelacion(3L, 4L);
    }

    @Test
    void proveedores_de_obra_lista() {
        ObraProveedor op = new ObraProveedor(1L, 2L);
        when(obraProveedorRepository.findByIdObra(1L)).thenReturn(List.of(op));

        List<ObraProveedor> result = service.proveedoresDeObra(1L);

        assertEquals(1, result.size());
        assertEquals(2L, result.get(0).getIdProveedor());
    }
}
