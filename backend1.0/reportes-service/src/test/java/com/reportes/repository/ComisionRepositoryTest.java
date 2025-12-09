package com.reportes.repository;

import com.reportes.entity.Comision;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ComisionRepositoryTest {

    @Autowired
    private ComisionRepository comisionRepository;

    @Test
    void guardaYConsultaComisionesPorObra() {
        Comision comision = new Comision();
        comision.setIdObra(10L);
        comision.setMonto(BigDecimal.valueOf(150));
        comision.setFecha(LocalDate.now());
        comisionRepository.save(comision);

        List<Comision> resultado = comisionRepository.findByIdObra(10L);
        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getMonto()).isEqualByComparingTo(BigDecimal.valueOf(150));
    }
}
