package proveedores.entity;

import jakarta.persistence.*;
import lombok.Data;
import proveedores.entity.Gremio;
import proveedores.entity.TipoProveedor;

import java.time.Instant;

@Entity
@Table(name="proveedores")
@Data
public class Proveedor {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String nombre;
    @ManyToOne
    @JoinColumn(name = "tipo_proveedor_id")
    private TipoProveedor tipoProveedor;
    @ManyToOne
    @JoinColumn(name = "gremio_id")
    private Gremio gremio;
    @Column(name = "dni_cuit")
    private String dniCuit;
    private String contacto, telefono, email, direccion;
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
