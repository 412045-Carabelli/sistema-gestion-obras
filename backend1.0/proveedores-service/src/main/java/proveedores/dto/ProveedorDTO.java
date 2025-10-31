package proveedores.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProveedorDTO {
    private Long id;
    private String nombre;
    private TipoProveedorDTO tipo_proveedor;
    private String contacto, telefono, email;
    private Boolean activo;
    private Instant creado_en;
    private Instant ultima_actualizacion;
    private String tipo_actualizacion;
}
