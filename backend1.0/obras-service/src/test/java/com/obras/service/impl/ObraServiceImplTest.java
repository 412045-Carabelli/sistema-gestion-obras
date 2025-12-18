package com.obras.service.impl;

import com.obras.dto.ObraDTO;
import com.obras.entity.Obra;
import com.obras.entity.ObraCosto;
import com.obras.enums.TipoCostoEnum;
import com.obras.repository.ObraRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ObraServiceImplTest {

    @Mock
    private ObraRepository obraRepository;

    @InjectMocks
    private ObraServiceImpl service;

    private Obra obra;

    @BeforeEach
    void setup() {
        obra = new Obra();
        obra.setId(10L);
        obra.setNombre("Obra Test");
        obra.setBeneficioGlobal(true);
        obra.setBeneficio(new BigDecimal("10"));
        obra.setTieneComision(true);
        obra.setComision(new BigDecimal("5"));

        ObraCosto original = ObraCosto.builder()
                .id(1L)
                .cantidad(new BigDecimal("2"))
                .precioUnitario(new BigDecimal("100"))
                .subtotal(new BigDecimal("200"))
                .beneficio(new BigDecimal("0"))
                .tipoCosto(TipoCostoEnum.ORIGINAL)
                .build();

        ObraCosto adicional = ObraCosto.builder()
                .id(2L)
                .cantidad(new BigDecimal("5"))
                .precioUnitario(new BigDecimal("10"))
                .subtotal(new BigDecimal("50"))
                .beneficio(new BigDecimal("15"))
                .tipoCosto(TipoCostoEnum.ADICIONAL)
                .build();

        obra.setCostos(List.of(original, adicional));
    }

    @Test
    void obtenerCalculaTotalesConBeneficioGlobalYComision() {
        when(obraRepository.findById(10L)).thenReturn(Optional.of(obra));

        Optional<ObraDTO> dtoOpt = service.obtener(10L);

        assertTrue(dtoOpt.isPresent());
        ObraDTO dto = dtoOpt.get();

        // Subtotales: 200 + 50 = 250
        assertEquals(new BigDecimal("250.00"), dto.getSubtotal_costos());

        // Beneficio: original usa global 10% (20), adicional 15% (7.5) => 27.5
        assertEquals(new BigDecimal("27.50"), dto.getBeneficio_costos());

        // Total con beneficio: 277.50
        assertEquals(new BigDecimal("277.50"), dto.getTotal_con_beneficio());

        // Comisión 5% sobre total con beneficio: 13.88 (redondeado)
        assertEquals(new BigDecimal("13.88"), dto.getComision_monto());

        // Beneficio neto = 27.50 - 13.88 = 13.62 (redondeado a 2 decimales)
        assertEquals(new BigDecimal("13.63"), dto.getBeneficio_neto());

        // Presupuesto final = total con beneficio + comisión
        assertEquals(new BigDecimal("291.38"), dto.getPresupuesto());
    }

    @Test
    void obtenerObraSinCostosDevuelveCeros() {
        Obra sinCostos = new Obra();
        sinCostos.setId(20L);
        sinCostos.setBeneficioGlobal(false);
        sinCostos.setTieneComision(false);
        when(obraRepository.findById(20L)).thenReturn(Optional.of(sinCostos));

        Optional<ObraDTO> dtoOpt = service.obtener(20L);
        assertTrue(dtoOpt.isPresent());
        ObraDTO dto = dtoOpt.get();

        assertEquals(BigDecimal.ZERO, dto.getSubtotal_costos());
        assertEquals(BigDecimal.ZERO, dto.getBeneficio_costos());
        assertEquals(BigDecimal.ZERO, dto.getTotal_con_beneficio());
        assertEquals(BigDecimal.ZERO, dto.getComision_monto());
        assertEquals(BigDecimal.ZERO, dto.getBeneficio_neto());
    }

    @Test
    void beneficiosIndividualesSinGlobalSinComision() {
        obra.setBeneficioGlobal(false);
        obra.setTieneComision(false);
        obra.setComision(null);

        ObraCosto original = ObraCosto.builder()
                .id(3L)
                .cantidad(new BigDecimal("1"))
                .precioUnitario(new BigDecimal("100"))
                .subtotal(new BigDecimal("100"))
                .beneficio(new BigDecimal("10"))
                .tipoCosto(TipoCostoEnum.ORIGINAL)
                .build();

        ObraCosto adicional = ObraCosto.builder()
                .id(4L)
                .cantidad(new BigDecimal("1"))
                .precioUnitario(new BigDecimal("100"))
                .subtotal(new BigDecimal("100"))
                .beneficio(new BigDecimal("20"))
                .tipoCosto(TipoCostoEnum.ADICIONAL)
                .build();

        obra.setCostos(List.of(original, adicional));

        when(obraRepository.findById(10L)).thenReturn(Optional.of(obra));

        ObraDTO dto = service.obtener(10L).orElseThrow();

        assertEquals(new BigDecimal("200.00"), dto.getSubtotal_costos());
        assertEquals(new BigDecimal("30.00"), dto.getBeneficio_costos());
        assertEquals(new BigDecimal("230.00"), dto.getTotal_con_beneficio());
        assertEquals(new BigDecimal("0.00"), dto.getComision_monto());
        assertEquals(new BigDecimal("30.00"), dto.getBeneficio_neto());
        assertEquals(new BigDecimal("230.00"), dto.getPresupuesto());
    }
}
