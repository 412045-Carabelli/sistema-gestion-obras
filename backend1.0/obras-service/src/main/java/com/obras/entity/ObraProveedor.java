package com.obras.entity;

import com.common.audit.AbstractAuditableEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Join entity that links obras and proveedores keeping auditing metadata.
 */
@Entity
@Table(name = "obra_proveedor")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(ObraProveedor.PK.class)
@EqualsAndHashCode(callSuper = true)
public class ObraProveedor extends AbstractAuditableEntity {
    @Id
    private Long idObra;
    @Id private Long idProveedor;

    /**
     * Composite primary key used by {@link ObraProveedor}.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PK implements Serializable {
        private Long idObra; private Long idProveedor;
    }
}
