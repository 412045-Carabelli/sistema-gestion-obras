package com.clientes;

import com.clientes.repository.ClienteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

import java.io.File;

@SpringBootApplication
public class ClientesServiceApplication {

    private static final Logger log = LoggerFactory.getLogger(ClientesServiceApplication.class);

    public static void main(String[] args) {
        File dbDir = new File("data");
        if (!dbDir.exists()) {
            dbDir.mkdirs();
        }
        SpringApplication.run(ClientesServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner dataLog(Environment env, ClienteRepository repo) {
        return args -> log.info(
                "DATA_INIT clientes-service -> port={}, db={}, data.sql={}, clientes={}",
                env.getProperty("server.port"),
                env.getProperty("spring.datasource.url"),
                env.getProperty("spring.sql.init.data-locations"),
                repo.count()
        );
    }
}
