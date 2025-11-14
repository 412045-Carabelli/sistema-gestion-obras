package proveedores.entity;

import jakarta.persistence.*;
import proveedores.enums.TipoProveedorEnum;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name="proveedores")
@Data
public class Proveedor {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String nombre;
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_proveedor")
    private TipoProveedorEnum tipoProveedor;
    private String contacto, telefono, email;
    private Boolean activo = Boolean.TRUE;
    @Column(name = "creado_en")
    private Instant creadoEn = Instant.now();

    @Column(name = "ultima_actualizacion")
    private Instant ultimaActualizacion;

    @Column(name = "tipo_actualizacion")
    private String tipoActualizacion;

    @PrePersist
    public void prePersist() {
        marcarAuditoria("CREATE");
    }

    @PreUpdate
    public void preUpdate() {
        marcarAuditoria("UPDATE");
    }

    @PreRemove
    public void preRemove() {
        marcarAuditoria("DELETE");
    }

    private void marcarAuditoria(String tipo) {
        this.ultimaActualizacion = Instant.now();
        this.tipoActualizacion = tipo;
    }
}
