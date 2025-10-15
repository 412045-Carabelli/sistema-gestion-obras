package proveedores.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "tipo_proveedor")
@Data
public class TipoProveedor {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String nombre;
    @Column(nullable = false) private Boolean activo;
}
