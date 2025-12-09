package com.transacciones;

import com.transacciones.repository.TransaccionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class TransaccionesServiceApplication {

    private static final Logger log = LoggerFactory.getLogger(TransaccionesServiceApplication.class);

    public static void main(String[] args) {
        java.io.File dbDir = new java.io.File("data");
        if (!dbDir.exists()) {
            dbDir.mkdirs();
        }
        SpringApplication.run(TransaccionesServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner dataLog(Environment env, TransaccionRepository repo) {
        return args -> log.info(
                "DATA_INIT transacciones-service -> port={}, db={}, data.sql={}, transacciones={}",
                env.getProperty("server.port"),
                env.getProperty("spring.datasource.url"),
                env.getProperty("spring.sql.init.data-locations"),
                repo.count()
        );
    }
}
