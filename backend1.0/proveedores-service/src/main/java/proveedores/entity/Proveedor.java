package proveedores.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name="proveedores")
@Data
public class Proveedor {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String nombre;
    @ManyToOne
    @JoinColumn(name = "id_tipo_proveedor")
    private TipoProveedor tipoProveedor;
    private String contacto, telefono, email;
    private Boolean activo = Boolean.TRUE;
    @Column(name = "creado_en")
    private Instant creadoEn = Instant.now();
}
