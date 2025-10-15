package proveedores;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ProveedoresServiceApplication {
    public static void main(String[] args) {
        var context = SpringApplication.run(ProveedoresServiceApplication.class, args);
        System.out.println("✅ Puerto configurado: " + context.getEnvironment().getProperty("server.port"));
    }
}
