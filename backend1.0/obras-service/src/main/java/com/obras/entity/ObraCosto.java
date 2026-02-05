package com.obras.entity;

import com.obras.enums.EstadoPagoEnum;
import com.obras.enums.TipoCostoEnum;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name="obra_costo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ObraCosto {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY) private Long id;

    @Column(name = "id_proveedor")
    private Long idProveedor;

    @Column(name = "precio_unitario", nullable = false)
    private BigDecimal precioUnitario;

    @Enumerated(EnumType.STRING)
    @Column(name = "id_estado_pago")
    private EstadoPagoEnum estadoPago;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_obra", nullable = false)
    private Obra obra;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_costo", nullable = false)
    private TipoCostoEnum tipoCosto = TipoCostoEnum.ORIGINAL;

    @Column(name = "item_numero")
    private String itemNumero;

    @Column(nullable=false) private String descripcion;
    @Column(nullable=false) private String unidad; // ej: m2, unidad
    @Column(nullable=false, precision=14, scale=3) private BigDecimal cantidad;

    @Column(precision=14, scale=2) private BigDecimal beneficio; // opcional

    @Column(nullable=false, precision=14, scale=2) private BigDecimal subtotal; // set en servicio
    @Column(nullable=false, precision=14, scale=2) private BigDecimal total;    // set en servicio

    private Boolean activo = Boolean.TRUE;
    @Column(name = "baja_obra")
    private Boolean bajaObra = Boolean.FALSE;

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

