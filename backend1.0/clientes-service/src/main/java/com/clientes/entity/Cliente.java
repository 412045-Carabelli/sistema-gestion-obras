package com.clientes.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name="clientes") @Data
public class Cliente {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String nombre;
    private String contacto, cuit, telefono, email;
    private Boolean activo = Boolean.TRUE;
    private Instant creadoEn = Instant.now();
}
