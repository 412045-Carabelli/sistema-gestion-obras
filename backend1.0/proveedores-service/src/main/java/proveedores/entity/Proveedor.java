package proveedores.entity;

import com.common.audit.AbstractAuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Entity that captures the supplier catalog with auditing information.
 */
@Entity
@Table(name = "proveedores")
@Data
@EqualsAndHashCode(callSuper = true)
public class Proveedor extends AbstractAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @ManyToOne
    @JoinColumn(name = "id_tipo_proveedor")
    private TipoProveedor tipoProveedor;

    private String contacto;

    private String telefono;

    private String email;

    private Boolean activo = Boolean.TRUE;
}
