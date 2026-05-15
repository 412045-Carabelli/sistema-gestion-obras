package com.documentos;

import com.documentos.repository.DocumentoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

import java.io.File;

@SpringBootApplication
public class DocumentosServiceApplication {

    private static final Logger log = LoggerFactory.getLogger(DocumentosServiceApplication.class);

    public static void main(String[] args) {
        File dbDir = new File("data");
        if (!dbDir.exists()) {
            dbDir.mkdirs();
        }
        SpringApplication.run(DocumentosServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner dataLog(Environment env, DocumentoRepository repo) {
        return args -> log.info(
                "DATA_INIT documentos-service -> port={}, db={}, data.sql={}, documentos={}",
                env.getProperty("server.port"),
                env.getProperty("spring.datasource.url"),
                env.getProperty("spring.sql.init.data-locations"),
                repo.count()
        );
    }
}
