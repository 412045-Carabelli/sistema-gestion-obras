package com.obras.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name="estado_tarea")
@Data
public class EstadoTarea {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(unique=true, nullable=false) private String nombre; // pendiente|en_progreso|completada
    private Boolean activo = Boolean.TRUE;
}

