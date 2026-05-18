package com.auth.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 255)
  private String email;

  @Column(nullable = false, unique = true, length = 100)
  private String username;

  @Column(nullable = false, length = 255)
  private String passwordHash;

  @Column(nullable = false, length = 50)
  private String rol;  // USER, ADMIN, etc.

  @Column(nullable = false)
  private Boolean activo = Boolean.TRUE;

  @Column(nullable = false)
  private Integer intentosFallidos = 0;

  @Column(name = "bloqueado_hasta")
  private Instant bloqueadoHasta;

  @Column(name = "creado_en", nullable = false)
  private Instant creadoEn;

  @Column(name = "ultima_actualizacion")
  private Instant ultimaActualizacion;

  @PrePersist
  protected void onCreate() {
    this.creadoEn = Instant.now();
    this.rol = "USER";
    this.activo = Boolean.TRUE;
    this.intentosFallidos = 0;
  }

  @PreUpdate
  protected void onUpdate() {
    this.ultimaActualizacion = Instant.now();
  }

  // Helper: está bloqueado ahora?
  public boolean estaBloqueado() {
    if (bloqueadoHasta == null) {
      return false;
    }
    if (Instant.now().isAfter(bloqueadoHasta)) {
      // Desbloquear automáticamente
      this.bloqueadoHasta = null;
      this.intentosFallidos = 0;
      return false;
    }
    return true;
  }
}
