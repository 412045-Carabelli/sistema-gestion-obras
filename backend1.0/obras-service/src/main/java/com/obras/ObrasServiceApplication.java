package com.obras;

import com.obras.repository.ObraCostoRepository;
import com.obras.repository.ObraProveedorRepository;
import com.obras.repository.ObraRepository;
import com.obras.repository.TareaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class ObrasServiceApplication {

    private static final Logger log = LoggerFactory.getLogger(ObrasServiceApplication.class);

    public static void main(String[] args) {
        java.io.File dbDir = new java.io.File("data");
        if (!dbDir.exists()) {
            dbDir.mkdirs();
        }
        SpringApplication.run(ObrasServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner dataLog(Environment env,
                              ObraRepository obraRepo,
                              ObraCostoRepository costoRepo,
                              TareaRepository tareaRepo,
                              ObraProveedorRepository opRepo) {
        return args -> log.info(
                "DATA_INIT obras-service -> port={}, db={}, data.sql={}, obras={}, costos={}, tareas={}, obra_proveedor={}",
                env.getProperty("server.port"),
                env.getProperty("spring.datasource.url"),
                env.getProperty("spring.sql.init.data-locations"),
                obraRepo.count(),
                costoRepo.count(),
                tareaRepo.count(),
                opRepo.count()
        );
    }
}
