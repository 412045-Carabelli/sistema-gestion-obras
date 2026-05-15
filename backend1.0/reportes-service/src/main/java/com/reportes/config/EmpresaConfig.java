package com.reportes.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "empresa")
@Data
public class EmpresaConfig {
    private String nombre;
    private String direccion;
    private String telefono;
    private String email;
    private String logo;
}
