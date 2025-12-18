package com.clientes.repository;

import com.clientes.entity.Cliente;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create",
        "spring.jpa.show-sql=false",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.community.dialect.SQLiteDialect"
})
class ClienteRepositoryTest {

    @Autowired
    private ClienteRepository clienteRepository;

    @DynamicPropertySource
    static void datasourceProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:sqlite::memory:");
        registry.add("spring.datasource.driver-class-name", () -> "org.sqlite.JDBC");
    }

    @Test
    void guardarClienteConCondicionIVA() {
        Cliente cliente = new Cliente();
        cliente.setNombre("Repo Cliente");
        cliente.setCondicionIva("Exento");

        Cliente saved = clienteRepository.save(cliente);

        assertNotNull(saved.getId());
        assertEquals("Exento", saved.getCondicionIVA());
    }

    @Test
    void buscarPorIdCorrectamente() {
        Cliente cliente = new Cliente();
        cliente.setNombre("Buscado");
        cliente.setCondicionIva("Consumidor Final");
        Cliente saved = clienteRepository.save(cliente);

        Optional<Cliente> encontrado = clienteRepository.findById(saved.getId());

        assertTrue(encontrado.isPresent());
        assertEquals("Buscado", encontrado.get().getNombre());
    }
}
