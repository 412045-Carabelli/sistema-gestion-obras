package com.auth.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "organizaciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organizacion {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 255)
  private String nombre;

  @Column(nullable = false)
  private Boolean activo = Boolean.TRUE;

  @Column(name = "creado_en", nullable = false)
  private Instant creadoEn;

  @PrePersist
  protected void onCreate() {
    this.creadoEn = Instant.now();
    this.activo = Boolean.TRUE;
  }
}
