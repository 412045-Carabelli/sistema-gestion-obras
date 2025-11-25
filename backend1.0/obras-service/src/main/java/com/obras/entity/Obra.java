package com.obras.entity;

import com.obras.enums.EstadoObraEnum;
import jakarta.persistence.*;
import lombok.*;
import java.util.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "obras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Obra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_cliente", nullable = false)
    private Long idCliente;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_obra", nullable = false)
    private EstadoObraEnum estadoObra;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(length = 255)
    private String direccion;

    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private LocalDateTime fechaAdjudicada;
    private LocalDateTime fechaPerdida;

    private BigDecimal presupuesto;

    private Boolean beneficioGlobal;
    private Boolean tieneComision;
    private BigDecimal beneficio;
    private BigDecimal comision;

    private Boolean activo = Boolean.TRUE;

    @Column(name = "creado_en", updatable = false)
    private Instant creadoEn;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Column(name = "ultima_actualizacion")
    private Instant ultimaActualizacion;

    @Column(name = "tipo_actualizacion")
    private String tipoActualizacion;

    @OneToMany(mappedBy = "obra", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ObraCosto> costos;

    @PrePersist
    public void prePersist() {
        if (this.activo == null) {
            this.activo = Boolean.TRUE;
        }
        marcarAuditoria("CREATE");
    }

    @PreUpdate
    public void preUpdate() {
        if (this.activo == null) {
            this.activo = Boolean.TRUE;
        }
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
