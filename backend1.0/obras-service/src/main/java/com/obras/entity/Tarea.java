package com.obras.entity;

import com.obras.enums.EstadoTareaEnum;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name="tareas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tarea {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;

    @Column(nullable=false, name = "id_obra") private Long idObra;
    @Column(nullable=false, name = "id_proveedor") private Long idProveedor;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_tarea", nullable = false)
    private EstadoTareaEnum estadoTarea;

    @Column(nullable=false, length=150) private String nombre;
    private String descripcion;

    @Column(name = "porcentaje", nullable = false)
    private Double porcentaje = 0d;

    @Column(name = "fecha_inicio")
    private LocalDateTime fechaInicio;
    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;

    @Column(nullable=false, name = "creado_en")
    private Instant creadoEn = Instant.now();

    private Boolean activo = Boolean.TRUE;

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
