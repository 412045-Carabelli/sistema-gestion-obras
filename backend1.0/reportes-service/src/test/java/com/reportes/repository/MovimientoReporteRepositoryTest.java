package com.reportes.repository;

import com.reportes.entity.MovimientoReporte;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class MovimientoReporteRepositoryTest {

    @Autowired
    private MovimientoReporteRepository movimientoReporteRepository;

    @Test
    void guardaYConsultaPorFecha() {
        MovimientoReporte movimiento = new MovimientoReporte();
        movimiento.setFecha(LocalDate.now());
        movimiento.setMonto(BigDecimal.TEN);
        movimiento.setTipo("TEST");
        movimientoReporteRepository.save(movimiento);

        List<MovimientoReporte> resultados = movimientoReporteRepository
                .findByFechaBetween(LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));
        assertThat(resultados).isNotEmpty();
    }
}
