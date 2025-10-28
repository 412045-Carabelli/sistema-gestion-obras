package proveedores.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TipoProveedorDTO {
    private Long id;
    private String nombre;
    private Boolean activo;
    private Instant ultima_actualizacion;
    private String tipo_actualizacion;
}
