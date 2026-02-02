package com.obras.service.impl;

import com.obras.dto.ObraCostoDTO;
import com.obras.entity.Obra;
import com.obras.entity.ObraCosto;
import com.obras.enums.EstadoObraEnum;
import com.obras.enums.EstadoPagoEnum;
import com.obras.enums.TipoCostoEnum;
import com.obras.repository.ObraCostoRepository;
import com.obras.repository.ObraRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ObraCostoServiceImplTest {

    @Mock
    private ObraCostoRepository costoRepo;

    @Mock
    private ObraRepository obraRepo;

    @InjectMocks
    private ObraCostoServiceImpl service;

    @Test
    void crear_costo_sin_tipo_falla() {
        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setId_obra(1L);

        assertThrows(IllegalArgumentException.class, () -> service.crear(dto));
    }

    @Test
    void crear_original_sin_proveedor_falla() {
        Obra obra = new Obra();
        obra.setId(1L);
        obra.setEstadoObra(null);

        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setId_obra(1L);
        dto.setTipo_costo(TipoCostoEnum.ORIGINAL);
        dto.setCantidad(new BigDecimal("1"));
        dto.setPrecio_unitario(new BigDecimal("10"));

        when(obraRepo.findById(1L)).thenReturn(Optional.of(obra));

        assertThrows(IllegalArgumentException.class, () -> service.crear(dto));
    }

    @Test
    void crear_original_en_progreso_falla() {
        Obra obra = new Obra();
        obra.setId(2L);
        obra.setEstadoObra(EstadoObraEnum.EN_PROGRESO);

        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setId_obra(2L);
        dto.setTipo_costo(TipoCostoEnum.ORIGINAL);
        dto.setId_proveedor(9L);
        dto.setCantidad(new BigDecimal("1"));
        dto.setPrecio_unitario(new BigDecimal("10"));

        when(obraRepo.findById(2L)).thenReturn(Optional.of(obra));

        assertThrows(IllegalStateException.class, () -> service.crear(dto));
    }

    @Test
    void crear_original_beneficio_global() {
        Obra obra = new Obra();
        obra.setId(3L);
        obra.setBeneficioGlobal(true);
        obra.setBeneficio(new BigDecimal("10"));

        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setId_obra(3L);
        dto.setTipo_costo(TipoCostoEnum.ORIGINAL);
        dto.setId_proveedor(7L);
        dto.setCantidad(new BigDecimal("2"));
        dto.setPrecio_unitario(new BigDecimal("100"));
        dto.setBeneficio(BigDecimal.ZERO);

        when(obraRepo.findById(3L)).thenReturn(Optional.of(obra));
        when(costoRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(costoRepo.findByObra_IdAndActivoTrue(3L)).thenReturn(List.of());
        when(obraRepo.findById(3L)).thenReturn(Optional.of(obra));
        when(obraRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ObraCostoDTO saved = service.crear(dto);

        assertEquals(new BigDecimal("200.00"), saved.getSubtotal());
        assertEquals(new BigDecimal("220.00"), saved.getTotal());
        assertEquals(TipoCostoEnum.ORIGINAL, saved.getTipo_costo());
    }

    @Test
    void crear_original_sin_global_usa_beneficio_propio() {
        Obra obra = new Obra();
        obra.setId(4L);
        obra.setBeneficioGlobal(false);

        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setId_obra(4L);
        dto.setTipo_costo(TipoCostoEnum.ORIGINAL);
        dto.setId_proveedor(7L);
        dto.setCantidad(new BigDecimal("1"));
        dto.setPrecio_unitario(new BigDecimal("100"));
        dto.setBeneficio(new BigDecimal("20"));

        when(obraRepo.findById(4L)).thenReturn(Optional.of(obra));
        when(costoRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(costoRepo.findByObra_IdAndActivoTrue(4L)).thenReturn(List.of());
        when(obraRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ObraCostoDTO saved = service.crear(dto);

        assertEquals(new BigDecimal("100.00"), saved.getSubtotal());
        assertEquals(new BigDecimal("120.00"), saved.getTotal());
    }

    @Test
    void crear_adicional_beneficio_propio_y_normaliza_item() {
        Obra obra = new Obra();
        obra.setId(5L);
        obra.setBeneficioGlobal(true);

        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setId_obra(5L);
        dto.setTipo_costo(TipoCostoEnum.ADICIONAL);
        dto.setId_proveedor(7L);
        dto.setItem_numero("  ");
        dto.setCantidad(new BigDecimal("5"));
        dto.setPrecio_unitario(new BigDecimal("10"));
        dto.setBeneficio(new BigDecimal("25"));

        when(obraRepo.findById(5L)).thenReturn(Optional.of(obra));
        when(costoRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(costoRepo.findByObra_IdAndActivoTrue(5L)).thenReturn(List.of());
        when(obraRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ObraCostoDTO saved = service.crear(dto);

        assertNull(saved.getItem_numero());
        assertEquals(new BigDecimal("50.00"), saved.getSubtotal());
        assertEquals(new BigDecimal("62.50"), saved.getTotal());
        assertEquals(EstadoPagoEnum.PENDIENTE, saved.getEstado_pago());
        assertEquals(Boolean.TRUE, saved.getActivo());
    }

    @Test
    void actualizar_estado_pago_null_default() {
        Obra obra = new Obra();
        obra.setId(6L);

        ObraCosto entity = ObraCosto.builder()
                .id(10L)
                .obra(obra)
                .estadoPago(EstadoPagoEnum.PAGADO)
                .tipoCosto(TipoCostoEnum.ADICIONAL)
                .build();

        when(costoRepo.findByIdAndActivoTrue(10L)).thenReturn(Optional.of(entity));
        when(costoRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ObraCostoDTO updated = service.actualizarEstadoPago(10L, null);

        assertEquals(EstadoPagoEnum.PENDIENTE, updated.getEstado_pago());
    }

    @Test
    void actualizar_estado_pago_no_encontrado_falla() {
        when(costoRepo.findByIdAndActivoTrue(99L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.actualizarEstadoPago(99L, EstadoPagoEnum.PAGADO));
    }

    @Test
    void actualizar_con_tipo_null_conserva_estado_y_recalcula() {
        Obra obra = new Obra();
        obra.setId(7L);
        obra.setBeneficioGlobal(false);

        ObraCosto existing = ObraCosto.builder()
                .id(11L)
                .obra(obra)
                .tipoCosto(TipoCostoEnum.ORIGINAL)
                .estadoPago(EstadoPagoEnum.PARCIAL)
                .build();

        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setId_proveedor(5L);
        dto.setCantidad(new BigDecimal("4"));
        dto.setPrecio_unitario(new BigDecimal("25"));
        dto.setBeneficio(new BigDecimal("20"));
        dto.setEstado_pago(null);
        dto.setTipo_costo(null);

        when(costoRepo.findByIdAndActivoTrue(11L)).thenReturn(Optional.of(existing));
        when(costoRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(costoRepo.findByObra_IdAndActivoTrue(7L)).thenReturn(List.of());
        when(obraRepo.findById(7L)).thenReturn(Optional.of(obra));
        when(obraRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ObraCostoDTO updated = service.actualizar(11L, dto);

        assertEquals(TipoCostoEnum.ORIGINAL, updated.getTipo_costo());
        assertEquals(EstadoPagoEnum.PARCIAL, updated.getEstado_pago());
        assertEquals(new BigDecimal("100.00"), updated.getSubtotal());
        assertEquals(new BigDecimal("120.00"), updated.getTotal());
    }

    @Test
    void actualizar_original_en_progreso_falla() {
        Obra obra = new Obra();
        obra.setId(8L);
        obra.setEstadoObra(EstadoObraEnum.EN_PROGRESO);

        ObraCosto existing = ObraCosto.builder()
                .id(12L)
                .obra(obra)
                .tipoCosto(TipoCostoEnum.ORIGINAL)
                .build();

        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setTipo_costo(null);

        when(costoRepo.findByIdAndActivoTrue(12L)).thenReturn(Optional.of(existing));

        assertThrows(IllegalStateException.class, () -> service.actualizar(12L, dto));
    }

    @Test
    void actualizar_original_sin_proveedor_falla() {
        Obra obra = new Obra();
        obra.setId(9L);

        ObraCosto existing = ObraCosto.builder()
                .id(13L)
                .obra(obra)
                .tipoCosto(TipoCostoEnum.ORIGINAL)
                .build();

        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setId_proveedor(null);

        when(costoRepo.findByIdAndActivoTrue(13L)).thenReturn(Optional.of(existing));

        assertThrows(IllegalArgumentException.class, () -> service.actualizar(13L, dto));
    }

    @Test
    void eliminar_no_encontrado_no_guardar() {
        when(costoRepo.findByIdAndActivoTrue(20L)).thenReturn(Optional.empty());

        service.eliminar(20L);

        verify(costoRepo, never()).save(any());
        verify(obraRepo, never()).save(any());
    }

    @Test
    void eliminar_original_en_progreso_falla() {
        Obra obra = new Obra();
        obra.setId(21L);
        obra.setEstadoObra(EstadoObraEnum.EN_PROGRESO);

        ObraCosto existing = ObraCosto.builder()
                .id(21L)
                .obra(obra)
                .tipoCosto(TipoCostoEnum.ORIGINAL)
                .build();

        when(costoRepo.findByIdAndActivoTrue(21L)).thenReturn(Optional.of(existing));

        assertThrows(IllegalStateException.class, () -> service.eliminar(21L));
    }

    @Test
    void listar_por_obra_ordena() {
        Obra obra = new Obra();
        obra.setId(30L);

        ObraCosto original = ObraCosto.builder()
                .id(2L)
                .obra(obra)
                .tipoCosto(TipoCostoEnum.ORIGINAL)
                .build();

        ObraCosto adicional = ObraCosto.builder()
                .id(1L)
                .obra(obra)
                .tipoCosto(TipoCostoEnum.ADICIONAL)
                .build();

        when(costoRepo.findByObra_IdAndActivoTrue(30L)).thenReturn(List.of(adicional, original));

        List<ObraCostoDTO> result = service.listarPorObra(30L);

        assertEquals(2, result.size());
        assertEquals(TipoCostoEnum.ORIGINAL, result.get(0).getTipo_costo());
        assertEquals(TipoCostoEnum.ADICIONAL, result.get(1).getTipo_costo());
    }

    @Test
    void actualizar_presupuesto_id_null_no_interactions() throws Exception {
        Method method = ObraCostoServiceImpl.class.getDeclaredMethod("actualizarPresupuestoObra", Long.class);
        method.setAccessible(true);

        method.invoke(service, new Object[]{null});

        verifyNoInteractions(obraRepo, costoRepo);
    }

    @Test
    void actualizar_presupuesto_obra_no_encontrada() throws Exception {
        Method method = ObraCostoServiceImpl.class.getDeclaredMethod("actualizarPresupuestoObra", Long.class);
        method.setAccessible(true);

        when(obraRepo.findById(40L)).thenReturn(Optional.empty());

        method.invoke(service, 40L);

        verify(obraRepo, never()).save(any());
    }

    @Test
    void actualizar_presupuesto_costos_null_set_cero() throws Exception {
        Method method = ObraCostoServiceImpl.class.getDeclaredMethod("actualizarPresupuestoObra", Long.class);
        method.setAccessible(true);

        Obra obra = new Obra();
        obra.setId(41L);

        when(obraRepo.findById(41L)).thenReturn(Optional.of(obra));
        when(costoRepo.findByObra_IdAndActivoTrue(41L)).thenReturn(null);
        when(obraRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        method.invoke(service, 41L);

        ArgumentCaptor<Obra> captor = ArgumentCaptor.forClass(Obra.class);
        verify(obraRepo).save(captor.capture());
        assertEquals(new BigDecimal("0.00"), captor.getValue().getPresupuesto());
    }

    @Test
    void actualizar_presupuesto_calcula_con_comision() throws Exception {
        Method method = ObraCostoServiceImpl.class.getDeclaredMethod("actualizarPresupuestoObra", Long.class);
        method.setAccessible(true);

        Obra obra = new Obra();
        obra.setId(42L);
        obra.setBeneficioGlobal(true);
        obra.setBeneficio(new BigDecimal("10"));
        obra.setTieneComision(true);
        obra.setComision(new BigDecimal("5"));

        ObraCosto original = ObraCosto.builder()
                .obra(obra)
                .tipoCosto(TipoCostoEnum.ORIGINAL)
                .subtotal(null)
                .cantidad(new BigDecimal("3"))
                .precioUnitario(new BigDecimal("100"))
                .beneficio(BigDecimal.ZERO)
                .build();

        ObraCosto adicional = ObraCosto.builder()
                .obra(obra)
                .tipoCosto(TipoCostoEnum.ADICIONAL)
                .subtotal(new BigDecimal("50"))
                .beneficio(new BigDecimal("20"))
                .build();

        when(obraRepo.findById(42L)).thenReturn(Optional.of(obra));
        when(costoRepo.findByObra_IdAndActivoTrue(42L)).thenReturn(List.of(original, adicional));
        when(obraRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        method.invoke(service, 42L);

        ArgumentCaptor<Obra> captor = ArgumentCaptor.forClass(Obra.class);
        verify(obraRepo).save(captor.capture());
        assertEquals(new BigDecimal("409.50"), captor.getValue().getPresupuesto());
    }

    @Test
    void validar_tipo_costo_null_reflection() throws Exception {
        Method method = ObraCostoServiceImpl.class.getDeclaredMethod("validarTipoCosto", TipoCostoEnum.class);
        method.setAccessible(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            try {
                method.invoke(service, new Object[]{null});
            } catch (Exception e) {
                throw (IllegalArgumentException) e.getCause();
            }
        });

        assertTrue(ex.getMessage().contains("tipo de costo"));
    }
}
