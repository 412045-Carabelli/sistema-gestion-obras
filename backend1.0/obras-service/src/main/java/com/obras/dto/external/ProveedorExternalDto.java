package com.obras.dto.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Espejo mínimo de proveedores.dto.ProveedorDTO (proveedores-service) — solo los campos que usa el Gantt. */
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProveedorExternalDto {
    private Long id;
    private String nombre;
    private Long gremio_id;
    private String gremio_nombre;
}
