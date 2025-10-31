package com.obras.entity;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_estado_tarea", nullable = false)
    private EstadoTarea estadoTarea;

    @Column(nullable=false, length=150) private String nombre;
    private String descripcion;

    @Column(name = "fecha_inicio")
    private LocalDateTime fechaInicio;
    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;

    @Column(nullable=false, name = "creado_en")
    private Instant creadoEn = Instant.now();

    private Boolean activo = Boolean.TRUE;
}

