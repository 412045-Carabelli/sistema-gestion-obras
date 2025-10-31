package com.obras.entity;

import com.common.audit.AbstractAuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Entity that represents the cost breakdown for an obra with auditing support.
 */
@Entity
@Table(name = "obra_costo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class ObraCosto extends AbstractAuditableEntity {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY) private Long id;

    @Column(name = "id_proveedor", nullable = false)
    private Long idProveedor;

    @Column(name = "precio_unitario", nullable = false)
    private BigDecimal precioUnitario;

    @ManyToOne
    @JoinColumn(name = "id_estado_pago")
    private EstadoPago estadoPago;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_obra", nullable = false)
    private Obra obra;

    @Column(nullable=false) private String descripcion;
    @Column(nullable=false) private String unidad; // ej: m2, unidad
    @Column(nullable=false, precision=14, scale=3) private BigDecimal cantidad;

    @Column(precision=14, scale=2) private BigDecimal beneficio; // opcional

    @Column(nullable=false, precision=14, scale=2) private BigDecimal subtotal; // set en servicio
    @Column(nullable=false, precision=14, scale=2) private BigDecimal total;    // set en servicio

    private Boolean activo = Boolean.TRUE;
}

