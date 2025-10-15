package proveedores.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProveedorDTO {
    private Long id;
    private String nombre;
    private TipoProveedorDTO tipo_proveedor;
    private String contacto, telefono, email;
}
