package com.transacciones.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "facturas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Factura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_cliente", nullable = false)
    private Long idCliente;

    @Column(name = "id_obra", nullable = false)
    private Long idObra;

    @Column(name = "monto", nullable = false)
    private Double monto;

    @Column(name = "monto_restante", nullable = false)
    private Double montoRestante;

    @Column(name = "fecha")
    private LocalDate fecha;

    @Column(name = "nombre_archivo")
    private String nombreArchivo;

    @Column(name = "path_archivo")
    private String pathArchivo;

    @Column(name = "activo")
    private Boolean activo = true;

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
