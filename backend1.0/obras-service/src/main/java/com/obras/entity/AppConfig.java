package com.obras.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "app_config")
@Getter
@Setter
@NoArgsConstructor
public class AppConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "clave", nullable = false, length = 100)
    private String clave;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String valor;

    @Column(length = 255)
    private String descripcion;

    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    @Column(name = "organizacion_id")
    private Long organizacionId;
}
