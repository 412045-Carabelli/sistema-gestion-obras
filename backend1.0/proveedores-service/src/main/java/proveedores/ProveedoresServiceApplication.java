package proveedores;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.web.client.RestTemplate;
import proveedores.repository.ProveedorRepository;

import java.io.File;

@SpringBootApplication
public class ProveedoresServiceApplication {

    private static final Logger log = LoggerFactory.getLogger(ProveedoresServiceApplication.class);

    public static void main(String[] args) {
        File dbDir = new File("data");
        if (!dbDir.exists()) {
            dbDir.mkdirs();
        }
        SpringApplication.run(ProveedoresServiceApplication.class, args);
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    CommandLineRunner dataLog(Environment env, ProveedorRepository repo) {
        return args -> log.info(
                "DATA_INIT proveedores-service -> port={}, db={}, data.sql={}, proveedores={}",
                env.getProperty("server.port"),
                env.getProperty("spring.datasource.url"),
                env.getProperty("spring.sql.init.data-locations"),
                repo.count()
        );
    }
}
