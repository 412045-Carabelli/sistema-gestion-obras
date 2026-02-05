package com.transacciones.entity;

import com.transacciones.enums.TipoTransaccionEnum;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "transacciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_obra", nullable = false)
    private Long idObra;

    @Column(name = "tipo_asociado", nullable = false)
    private String tipoAsociado;

    @Column(name = "id_asociado", nullable = false)
    private Long idAsociado;

    @Enumerated(EnumType.STRING)
    @Column(name = "id_tipo_transaccion", nullable = false)
    private TipoTransaccionEnum tipo_transaccion;

    @Column(name = "fecha")
    private LocalDate fecha;

    @Column(name = "monto", nullable = false)
    private Double monto;

    @Column(name = "forma_pago", nullable = false)
    private String forma_pago; // Parcial | Total

    @Column(name = "medio_pago")
    private String medio_pago; // transferencia, efectivo, cheque, etc.

    @Column(name = "factura_cobrada")
    private Boolean facturaCobrada;

    @Column(name = "activo")
    private Boolean activo = true;
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
