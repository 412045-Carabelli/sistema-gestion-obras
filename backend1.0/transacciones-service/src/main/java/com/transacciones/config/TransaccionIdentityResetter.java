package com.transacciones.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

@Component
public class TransaccionIdentityResetter implements ApplicationRunner {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public TransaccionIdentityResetter(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!isH2()) {
            return;
        }

        Long maxId = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(id), 0) FROM transacciones", Long.class);
        long next = (maxId != null ? maxId : 0L) + 1L;
        jdbcTemplate.execute("ALTER TABLE transacciones ALTER COLUMN id RESTART WITH " + next);
    }

    private boolean isH2() {
        try (Connection connection = dataSource.getConnection()) {
            String product = connection.getMetaData().getDatabaseProductName();
            return product != null && product.toUpperCase().contains("H2");
        } catch (Exception ignored) {
            return false;
        }
    }
}
