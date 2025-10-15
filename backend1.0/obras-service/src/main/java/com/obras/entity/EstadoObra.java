package com.obras.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name="estado_obra")
@Data
public class EstadoObra {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(unique=true, nullable=false) private String nombre;
    private Boolean activo = Boolean.TRUE;
}
