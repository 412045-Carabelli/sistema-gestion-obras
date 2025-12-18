package com.obras.service.impl;

import com.obras.dto.ObraCostoDTO;
import com.obras.entity.Obra;
import com.obras.entity.ObraCosto;
import com.obras.enums.TipoCostoEnum;
import com.obras.repository.ObraCostoRepository;
import com.obras.repository.ObraRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ObraCostoServiceImplTest {

    @Mock
    private ObraCostoRepository costoRepo;
    @Mock
    private ObraRepository obraRepo;

    @InjectMocks
    private ObraCostoServiceImpl service;

    private Obra obraConBeneficioGlobal;

    @BeforeEach
    void setup() {
        obraConBeneficioGlobal = new Obra();
        obraConBeneficioGlobal.setId(1L);
        obraConBeneficioGlobal.setBeneficioGlobal(true);
        obraConBeneficioGlobal.setBeneficio(new BigDecimal("10"));
    }

    @Test
    @DisplayName("Crear costo sin tipo lanza error")
    void crearCostoSinTipoFalla() {
        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setId_obra(1L);
        assertThrows(IllegalArgumentException.class, () -> service.crear(dto));
    }

    @Test
    void crearCostoOriginal_aplicaBeneficioGlobal() {
        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setId_obra(1L);
        dto.setTipo_costo(TipoCostoEnum.ORIGINAL);
        dto.setCantidad(new BigDecimal("2"));
        dto.setPrecio_unitario(new BigDecimal("100"));
        dto.setBeneficio(BigDecimal.ZERO);

        when(obraRepo.findById(1L)).thenReturn(Optional.of(obraConBeneficioGlobal));
        when(costoRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ObraCostoDTO saved = service.crear(dto);

        assertEquals(new BigDecimal("200.00"), saved.getSubtotal());
        assertEquals(new BigDecimal("220.00"), saved.getTotal());
        assertEquals(TipoCostoEnum.ORIGINAL, saved.getTipo_costo());
    }

    @Test
    void crearCostoAdicional_usaBeneficioPropio() {
        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setId_obra(1L);
        dto.setTipo_costo(TipoCostoEnum.ADICIONAL);
        dto.setCantidad(new BigDecimal("5"));
        dto.setPrecio_unitario(new BigDecimal("10"));
        dto.setBeneficio(new BigDecimal("25"));

        when(obraRepo.findById(1L)).thenReturn(Optional.of(obraConBeneficioGlobal));
        when(costoRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ObraCostoDTO saved = service.crear(dto);

        assertEquals(new BigDecimal("50.00"), saved.getSubtotal());
        assertEquals(new BigDecimal("62.50"), saved.getTotal());
        assertEquals(TipoCostoEnum.ADICIONAL, saved.getTipo_costo());
    }

    @Test
    void actualizarCostoAdicional_recalculaTotal() {
        // costo existente
        ObraCosto existing = ObraCosto.builder()
                .id(5L)
                .obra(obraConBeneficioGlobal)
                .tipoCosto(TipoCostoEnum.ORIGINAL)
                .cantidad(new BigDecimal("3"))
                .precioUnitario(new BigDecimal("50"))
                .beneficio(new BigDecimal("0"))
                .build();

        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setTipo_costo(TipoCostoEnum.ADICIONAL);
        dto.setCantidad(new BigDecimal("4"));
        dto.setPrecio_unitario(new BigDecimal("25"));
        dto.setBeneficio(new BigDecimal("20"));

        when(costoRepo.findByIdAndActivoTrue(5L)).thenReturn(Optional.of(existing));
        when(costoRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ObraCostoDTO updated = service.actualizar(5L, dto);

        assertEquals(TipoCostoEnum.ADICIONAL, updated.getTipo_costo());
        assertEquals(new BigDecimal("100.00"), updated.getSubtotal());
        assertEquals(new BigDecimal("120.00"), updated.getTotal());
    }
}
