package com.obras.service.impl;

import com.obras.dto.ObraCostoDTO;
import com.obras.dto.ObraDTO;
import com.obras.entity.Obra;
import com.obras.entity.ObraCosto;
import com.obras.enums.EstadoObraEnum;
import com.obras.enums.EstadoPagoEnum;
import com.obras.enums.TipoCostoEnum;
import com.obras.repository.ObraCostoRepository;
import com.obras.repository.ObraRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ObraServiceImplTest {

    @Mock
    private ObraRepository obraRepo;

    @Mock
    private ObraCostoRepository costoRepo;

    @InjectMocks
    private ObraServiceImpl service;

    @Test
    void crear_mapea_costos_y_normaliza_items() {
        ObraDTO dto = new ObraDTO();
        dto.setId(100L);
        dto.setId_cliente(55L);
        dto.setNombre("Obra X");
        dto.setObra_estado(EstadoObraEnum.COTIZADA);
        dto.setBeneficio_global(true);
        dto.setBeneficio(new BigDecimal("10"));
        dto.setTiene_comision(true);
        dto.setComision(new BigDecimal("5"));

        ObraCostoDTO c1 = new ObraCostoDTO();
        c1.setTipo_costo(TipoCostoEnum.ORIGINAL);
        c1.setId_proveedor(7L);
        c1.setItem_numero(" 001 ");
        c1.setCantidad(new BigDecimal("2"));
        c1.setPrecio_unitario(new BigDecimal("100"));
        c1.setBeneficio(new BigDecimal("99"));

        ObraCostoDTO c2 = new ObraCostoDTO();
        c2.setTipo_costo(TipoCostoEnum.ADICIONAL);
        c2.setItem_numero("  ");
        c2.setCantidad(new BigDecimal("1"));
        c2.setPrecio_unitario(new BigDecimal("50"));
        c2.setBeneficio(new BigDecimal("20"));

        ObraCostoDTO c3 = new ObraCostoDTO();
        c3.setTipo_costo(null);
        c3.setId_proveedor(8L);
        c3.setItem_numero(null);
        c3.setCantidad(null);
        c3.setPrecio_unitario(null);
        c3.setBeneficio(null);

        dto.setCostos(List.of(c1, c2, c3));

        when(obraRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(costoRepo.findByObra_IdAndActivoTrue(100L)).thenReturn(List.of());

        service.crear(dto);

        ArgumentCaptor<Obra> captor = ArgumentCaptor.forClass(Obra.class);
        verify(obraRepo).save(captor.capture());
        Obra saved = captor.getValue();

        assertTrue(saved.getActivo());
        assertNotNull(saved.getCreadoEn());
        assertEquals(3, saved.getCostos().size());

        ObraCosto original = saved.getCostos().stream()
                .filter(c -> TipoCostoEnum.ORIGINAL.equals(c.getTipoCosto()))
                .findFirst()
                .orElseThrow();

        assertEquals("001", original.getItemNumero());
        assertEquals(new BigDecimal("200"), original.getSubtotal());
        assertEquals(new BigDecimal("220.00"), original.getTotal());
        assertEquals(EstadoPagoEnum.PENDIENTE, original.getEstadoPago());
        assertEquals(Boolean.TRUE, original.getActivo());

        ObraCosto adicional = saved.getCostos().stream()
                .filter(c -> TipoCostoEnum.ADICIONAL.equals(c.getTipoCosto()))
                .findFirst()
                .orElseThrow();

        assertNull(adicional.getItemNumero());
        assertEquals(new BigDecimal("50"), adicional.getSubtotal());
        assertEquals(new BigDecimal("60.00"), adicional.getTotal());
        assertEquals(EstadoPagoEnum.PENDIENTE, adicional.getEstadoPago());
        assertEquals(Boolean.TRUE, adicional.getActivo());

        ObraCosto defaultTipo = saved.getCostos().stream()
                .filter(c -> TipoCostoEnum.ORIGINAL.equals(c.getTipoCosto()) && c.getIdProveedor().equals(8L))
                .findFirst()
                .orElseThrow();

        assertNull(defaultTipo.getItemNumero());
        assertEquals(BigDecimal.ZERO, defaultTipo.getSubtotal());
    }

    @Test
    void obtener_calcula_totales_y_ordena_costos() {
        Obra obra = new Obra();
        obra.setId(10L);
        obra.setBeneficioGlobal(true);
        obra.setBeneficio(new BigDecimal("10"));
        obra.setTieneComision(true);
        obra.setComision(new BigDecimal("5"));

        ObraCosto originalNullId = ObraCosto.builder()
                .id(null)
                .tipoCosto(TipoCostoEnum.ORIGINAL)
                .subtotal(new BigDecimal("200"))
                .beneficio(new BigDecimal("20"))
                .build();

        ObraCosto originalCalc = ObraCosto.builder()
                .id(1L)
                .tipoCosto(TipoCostoEnum.ORIGINAL)
                .subtotal(null)
                .cantidad(new BigDecimal("3"))
                .precioUnitario(new BigDecimal("100"))
                .beneficio(new BigDecimal("0"))
                .build();

        ObraCosto adicional = ObraCosto.builder()
                .id(2L)
                .tipoCosto(TipoCostoEnum.ADICIONAL)
                .subtotal(new BigDecimal("50"))
                .beneficio(new BigDecimal("15"))
                .build();

        List<ObraCosto> costos = Arrays.asList(adicional, originalCalc, originalNullId);

        when(obraRepo.findById(10L)).thenReturn(Optional.of(obra));
        when(costoRepo.findByObra_IdAndActivoTrue(10L)).thenReturn(costos);

        ObraDTO dto = service.obtener(10L).orElseThrow();

        assertEquals(new BigDecimal("550.00"), dto.getSubtotal_costos());
        assertEquals(new BigDecimal("57.50"), dto.getBeneficio_costos());
        assertEquals(new BigDecimal("607.50"), dto.getTotal_con_beneficio());
        assertEquals(new BigDecimal("30.38"), dto.getComision_monto());
        assertEquals(new BigDecimal("27.13"), dto.getBeneficio_neto());
        assertEquals(new BigDecimal("637.88"), dto.getPresupuesto());

        assertNotNull(dto.getCostos());
        assertEquals(3, dto.getCostos().size());
        assertNull(dto.getCostos().get(0).getId());
        assertEquals(Long.valueOf(1L), dto.getCostos().get(1).getId());
        assertEquals(TipoCostoEnum.ADICIONAL, dto.getCostos().get(2).getTipo_costo());
    }

    @Test
    void listar_mapea_page() {
        Obra o1 = new Obra();
        o1.setId(1L);
        Obra o2 = new Obra();
        o2.setId(2L);

        Page<Obra> page = new PageImpl<>(List.of(o1, o2), PageRequest.of(0, 2), 2);

        when(obraRepo.findAll(any(PageRequest.class))).thenReturn(page);
        when(costoRepo.findByObra_IdAndActivoTrue(1L)).thenReturn(List.of());
        when(costoRepo.findByObra_IdAndActivoTrue(2L)).thenReturn(List.of());

        Page<ObraDTO> result = service.listar(PageRequest.of(0, 2));

        assertEquals(2, result.getTotalElements());
        assertEquals(2, result.getContent().size());
    }

    @Test
    void actualizar_actualiza_campos_y_estado() {
        Obra existing = new Obra();
        existing.setId(9L);
        existing.setEstadoObra(EstadoObraEnum.PRESUPUESTADA);

        ObraDTO dto = new ObraDTO();
        dto.setNombre("Nuevo");
        dto.setDireccion("Dir");
        dto.setFecha_inicio(LocalDateTime.of(2026, 1, 1, 0, 0));
        dto.setFecha_fin(LocalDateTime.of(2026, 2, 1, 0, 0));
        dto.setObra_estado(EstadoObraEnum.FINALIZADA);
        dto.setPresupuesto(new BigDecimal("100"));
        dto.setBeneficio_global(true);
        dto.setTiene_comision(true);
        dto.setBeneficio(new BigDecimal("10"));
        dto.setComision(new BigDecimal("5"));
        dto.setId_cliente(7L);
        dto.setNotas("Notas");
        dto.setRequiere_factura(Boolean.TRUE);

        when(obraRepo.findById(9L)).thenReturn(Optional.of(existing));
        when(obraRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(costoRepo.findByObra_IdAndActivoTrue(9L)).thenReturn(List.of());

        service.actualizar(9L, dto);

        ArgumentCaptor<Obra> captor = ArgumentCaptor.forClass(Obra.class);
        verify(obraRepo).save(captor.capture());
        Obra saved = captor.getValue();

        assertEquals("Nuevo", saved.getNombre());
        assertEquals("Dir", saved.getDireccion());
        assertEquals(EstadoObraEnum.FINALIZADA, saved.getEstadoObra());
        assertEquals(new BigDecimal("100"), saved.getPresupuesto());
        assertEquals(Boolean.TRUE, saved.getRequiereFactura());
    }

    @Test
    void actualizar_sin_estado_no_cambia_estado() {
        Obra existing = new Obra();
        existing.setId(11L);
        existing.setEstadoObra(EstadoObraEnum.EN_PROGRESO);

        ObraDTO dto = new ObraDTO();
        dto.setNombre("X");
        dto.setFecha_inicio(LocalDateTime.of(2026, 1, 1, 0, 0));
        dto.setFecha_fin(LocalDateTime.of(2026, 1, 2, 0, 0));

        when(obraRepo.findById(11L)).thenReturn(Optional.of(existing));
        when(obraRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(costoRepo.findByObra_IdAndActivoTrue(11L)).thenReturn(List.of());

        service.actualizar(11L, dto);

        ArgumentCaptor<Obra> captor = ArgumentCaptor.forClass(Obra.class);
        verify(obraRepo).save(captor.capture());
        assertEquals(EstadoObraEnum.EN_PROGRESO, captor.getValue().getEstadoObra());
    }

    @Test
    void actualizar_fecha_invalida_lanza() {
        ObraDTO dto = new ObraDTO();
        dto.setFecha_inicio(LocalDateTime.of(2026, 2, 1, 0, 0));
        dto.setFecha_fin(LocalDateTime.of(2026, 1, 1, 0, 0));

        assertThrows(IllegalArgumentException.class, () -> service.actualizar(1L, dto));
    }

    @Test
    void cambiar_estado_no_encontrado_lanza() {
        when(obraRepo.findById(99L)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> service.cambiarEstado(99L, EstadoObraEnum.COTIZADA));
    }

    @Test
    void cambiar_estado_null_usa_presupuestada() {
        Obra obra = new Obra();
        obra.setId(5L);
        obra.setEstadoObra(EstadoObraEnum.COTIZADA);

        when(obraRepo.findById(5L)).thenReturn(Optional.of(obra));
        when(obraRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.cambiarEstado(5L, null);

        ArgumentCaptor<Obra> captor = ArgumentCaptor.forClass(Obra.class);
        verify(obraRepo).save(captor.capture());
        assertEquals(EstadoObraEnum.PRESUPUESTADA, captor.getValue().getEstadoObra());
    }

    @Test
    void activar_toggle_activo() {
        Obra obra = new Obra();
        obra.setId(2L);
        obra.setActivo(Boolean.TRUE);

        when(obraRepo.findById(2L)).thenReturn(Optional.of(obra));
        when(obraRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.activar(2L);

        ArgumentCaptor<Obra> captor = ArgumentCaptor.forClass(Obra.class);
        verify(obraRepo).save(captor.capture());
        assertEquals(Boolean.FALSE, captor.getValue().getActivo());
    }

    @Test
    void activar_activo_null_se_vuelve_true() {
        Obra obra = new Obra();
        obra.setId(3L);
        obra.setActivo(null);

        when(obraRepo.findById(3L)).thenReturn(Optional.of(obra));
        when(obraRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.activar(3L);

        ArgumentCaptor<Obra> captor = ArgumentCaptor.forClass(Obra.class);
        verify(obraRepo).save(captor.capture());
        assertEquals(Boolean.TRUE, captor.getValue().getActivo());
    }

    @Test
    void parse_estado_reflection() throws Exception {
        Method parse = ObraServiceImpl.class.getDeclaredMethod("parseEstado", Object.class);
        parse.setAccessible(true);

        Object ok = parse.invoke(service, "en_progreso");
        assertEquals(EstadoObraEnum.EN_PROGRESO, ok);

        RuntimeException invalid = assertThrows(RuntimeException.class, () -> {
            try {
                parse.invoke(service, "no-existe");
            } catch (Exception e) {
                throw (RuntimeException) e.getCause();
            }
        });
        assertTrue(invalid.getMessage().contains("Estado de obra"));

        RuntimeException unsupported = assertThrows(RuntimeException.class, () -> {
            try {
                parse.invoke(service, 123);
            } catch (Exception e) {
                throw (RuntimeException) e.getCause();
            }
        });
        assertTrue(unsupported.getMessage().contains("no soportado"));
    }

    @Test
    void validar_fechas_null_no_falla() throws Exception {
        Method validar = ObraServiceImpl.class.getDeclaredMethod("validarFechas", ObraDTO.class);
        validar.setAccessible(true);
        validar.invoke(service, new Object[]{null});
    }

    @Test
    void calcular_totales_obra_null() throws Exception {
        Method calcular = ObraServiceImpl.class.getDeclaredMethod("calcularTotalesObra", Obra.class);
        calcular.setAccessible(true);
        Object result = calcular.invoke(service, new Object[]{null});
        assertNotNull(result);
    }

    @Test
    void to_dto_con_id_null_devuelve_totales_cero() throws Exception {
        Method toDto = ObraServiceImpl.class.getDeclaredMethod("toDto", Obra.class);
        toDto.setAccessible(true);

        Obra obra = new Obra();
        obra.setId(null);

        ObraDTO dto = (ObraDTO) toDto.invoke(service, obra);

        assertEquals(BigDecimal.ZERO, dto.getSubtotal_costos());
        assertEquals(BigDecimal.ZERO, dto.getBeneficio_costos());
        assertEquals(BigDecimal.ZERO, dto.getTotal_con_beneficio());
        assertEquals(BigDecimal.ZERO, dto.getComision_monto());
        assertEquals(BigDecimal.ZERO, dto.getBeneficio_neto());

        verifyNoInteractions(costoRepo);
    }
}
