package com.obras.service.impl;

import com.obras.dto.TareaDTO;
import com.obras.entity.Tarea;
import com.obras.enums.EstadoTareaEnum;
import com.obras.repository.TareaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TareaServiceImplTest {

    @Mock
    private TareaRepository tareaRepo;

    @InjectMocks
    private TareaServiceImpl service;

    @Test
    void crear_numero_auto_porcentaje_default() {
        TareaDTO dto = new TareaDTO();
        dto.setId_obra(1L);
        dto.setId_proveedor(2L);
        dto.setNombre("Tarea A");
        dto.setNumero_orden(null);
        dto.setPorcentaje(null);

        when(tareaRepo.maxNumeroOrdenByObra(1L)).thenReturn(5L);
        when(tareaRepo.sumPorcentajeByObraExcluyendo(1L, null)).thenReturn(10d);
        when(tareaRepo.countByIdObraAndNumeroOrdenAndActivoTrue(1L, 6L)).thenReturn(0L);
        when(tareaRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        TareaDTO saved = service.crear(dto);

        assertEquals(6L, saved.getNumero_orden());
        assertEquals(0d, saved.getPorcentaje());
        assertEquals(EstadoTareaEnum.PENDIENTE, saved.getEstado_tarea());
        assertEquals(Boolean.TRUE, saved.getActivo());
    }

    @Test
    void crear_porcentaje_negativo_falla() {
        TareaDTO dto = new TareaDTO();
        dto.setId_obra(1L);
        dto.setPorcentaje(-1d);

        assertThrows(IllegalArgumentException.class, () -> service.crear(dto));
    }

    @Test
    void crear_porcentaje_excede_falla() {
        TareaDTO dto = new TareaDTO();
        dto.setId_obra(2L);
        dto.setPorcentaje(20d);

        when(tareaRepo.sumPorcentajeByObraExcluyendo(2L, null)).thenReturn(90d);

        assertThrows(IllegalArgumentException.class, () -> service.crear(dto));
    }

    @Test
    void crear_numero_orden_invalido_falla() {
        TareaDTO dto = new TareaDTO();
        dto.setId_obra(3L);
        dto.setNumero_orden(0L);

        when(tareaRepo.sumPorcentajeByObraExcluyendo(3L, null)).thenReturn(0d);

        assertThrows(IllegalArgumentException.class, () -> service.crear(dto));
    }

    @Test
    void crear_numero_orden_repetido_falla() {
        TareaDTO dto = new TareaDTO();
        dto.setId_obra(4L);
        dto.setNumero_orden(1L);

        when(tareaRepo.sumPorcentajeByObraExcluyendo(4L, null)).thenReturn(0d);
        when(tareaRepo.countByIdObraAndNumeroOrdenAndActivoTrue(4L, 1L)).thenReturn(1L);

        assertThrows(IllegalArgumentException.class, () -> service.crear(dto));
    }

    @Test
    void crear_id_obra_null_usa_orden_uno() {
        TareaDTO dto = new TareaDTO();
        dto.setId_obra(null);
        dto.setNombre("Tarea X");

        when(tareaRepo.sumPorcentajeByObraExcluyendo(null, null)).thenReturn(0d);
        when(tareaRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        TareaDTO saved = service.crear(dto);

        assertEquals(1L, saved.getNumero_orden());
    }

    @Test
    void crear_max_numero_null_usa_uno() {
        TareaDTO dto = new TareaDTO();
        dto.setId_obra(6L);
        dto.setNombre("Tarea Y");

        when(tareaRepo.maxNumeroOrdenByObra(6L)).thenReturn(null);
        when(tareaRepo.sumPorcentajeByObraExcluyendo(6L, null)).thenReturn(0d);
        when(tareaRepo.countByIdObraAndNumeroOrdenAndActivoTrue(6L, 1L)).thenReturn(0L);
        when(tareaRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        TareaDTO saved = service.crear(dto);

        assertEquals(1L, saved.getNumero_orden());
    }

    @Test
    void actualizar_no_encontrado_falla() {
        when(tareaRepo.findByIdAndActivoTrue(99L)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> service.actualizar(99L, new TareaDTO()));
    }

    @Test
    void actualizar_actualiza_y_preserva_campos() {
        Tarea existente = new Tarea();
        existente.setId(10L);
        existente.setIdObra(20L);
        existente.setIdProveedor(30L);
        existente.setNumeroOrden(2L);
        existente.setEstadoTarea(EstadoTareaEnum.COMPLETADA);
        existente.setCreadoEn(Instant.EPOCH);
        existente.setActivo(Boolean.TRUE);

        TareaDTO dto = new TareaDTO();
        dto.setPorcentaje(10d);
        dto.setNumero_orden(null);
        dto.setNombre("Nueva");
        dto.setFecha_inicio(LocalDateTime.of(2026, 1, 1, 0, 0));

        when(tareaRepo.findByIdAndActivoTrue(10L)).thenReturn(Optional.of(existente));
        when(tareaRepo.sumPorcentajeByObraExcluyendo(20L, 10L)).thenReturn(20d);
        when(tareaRepo.countByIdObraAndNumeroOrdenAndIdNotAndActivoTrue(20L, 2L, 10L)).thenReturn(0L);
        when(tareaRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        TareaDTO updated = service.actualizar(10L, dto);

        assertEquals(2L, updated.getNumero_orden());
        assertEquals(EstadoTareaEnum.PENDIENTE, updated.getEstado_tarea());
        assertEquals(10d, updated.getPorcentaje());

        ArgumentCaptor<Tarea> captor = ArgumentCaptor.forClass(Tarea.class);
        verify(tareaRepo).save(captor.capture());
        assertEquals(Instant.EPOCH, captor.getValue().getCreadoEn());
        assertEquals(Boolean.TRUE, captor.getValue().getActivo());
    }

    @Test
    void completar_tarea_toggle_a_completada() {
        Tarea tarea = new Tarea();
        tarea.setId(1L);
        tarea.setEstadoTarea(EstadoTareaEnum.PENDIENTE);

        when(tareaRepo.findByIdAndActivoTrue(1L)).thenReturn(Optional.of(tarea));
        when(tareaRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        TareaDTO dto = service.completarTarea(1L);

        assertEquals(EstadoTareaEnum.COMPLETADA, dto.getEstado_tarea());
    }

    @Test
    void completar_tarea_toggle_a_pendiente() {
        Tarea tarea = new Tarea();
        tarea.setId(2L);
        tarea.setEstadoTarea(EstadoTareaEnum.COMPLETADA);

        when(tareaRepo.findByIdAndActivoTrue(2L)).thenReturn(Optional.of(tarea));
        when(tareaRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        TareaDTO dto = service.completarTarea(2L);

        assertEquals(EstadoTareaEnum.PENDIENTE, dto.getEstado_tarea());
    }

    @Test
    void borrar_desactiva() {
        Tarea tarea = new Tarea();
        tarea.setId(3L);
        tarea.setActivo(Boolean.TRUE);

        when(tareaRepo.findByIdAndActivoTrue(3L)).thenReturn(Optional.of(tarea));
        when(tareaRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.borrar(3L);

        ArgumentCaptor<Tarea> captor = ArgumentCaptor.forClass(Tarea.class);
        verify(tareaRepo).save(captor.capture());
        assertEquals(Boolean.FALSE, captor.getValue().getActivo());
    }

    @Test
    void borrar_no_encontrado_no_guardar() {
        when(tareaRepo.findByIdAndActivoTrue(4L)).thenReturn(Optional.empty());

        service.borrar(4L);

        verify(tareaRepo, never()).save(any());
    }

    @Test
    void tareas_de_obra_mapea() {
        Tarea t1 = new Tarea();
        t1.setId(1L);
        t1.setIdObra(10L);
        t1.setIdProveedor(20L);
        t1.setNumeroOrden(1L);
        t1.setEstadoTarea(EstadoTareaEnum.PENDIENTE);
        t1.setPorcentaje(10d);

        Tarea t2 = new Tarea();
        t2.setId(2L);
        t2.setIdObra(10L);
        t2.setIdProveedor(21L);
        t2.setNumeroOrden(2L);
        t2.setEstadoTarea(EstadoTareaEnum.COMPLETADA);
        t2.setPorcentaje(20d);

        when(tareaRepo.findByIdObraAndActivoTrueOrderByNumeroOrdenAscFechaInicioAscCreadoEnAsc(10L))
                .thenReturn(List.of(t1, t2));

        List<TareaDTO> result = service.tareasDeObra(10L);

        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals(2L, result.get(1).getId());
    }

    @Test
    void tareas_de_proveedor_mapea() {
        Tarea t1 = new Tarea();
        t1.setId(5L);
        t1.setIdProveedor(99L);

        when(tareaRepo.findByIdProveedorAndActivoTrue(99L)).thenReturn(List.of(t1));

        List<TareaDTO> result = service.tareasDeProveedor(99L);

        assertEquals(1, result.size());
        assertEquals(5L, result.get(0).getId());
    }
}
