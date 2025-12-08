package proveedores.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
public class ProveedorDTO {
    private Long id;
    private String nombre;
    private Long tipo_proveedor_id;
    private String tipo_proveedor_nombre;
    private Long gremio_id;
    private String gremio_nombre;
    // retro-compat: value used for selects that still expect a flat string
    private String tipo_proveedor;
    private String contacto, telefono, email;
    private Boolean activo;
    private Instant creado_en;
    private Instant ultima_actualizacion;
    private String tipo_actualizacion;
}
