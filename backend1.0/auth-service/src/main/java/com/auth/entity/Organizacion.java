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

  @Column(name = "razon_social", length = 255)
  private String razonSocial;

  @Column(name = "cuit", length = 20)
  private String cuit;

  @Column(name = "email", length = 255)
  private String email;

  @Column(name = "telefono", length = 50)
  private String telefono;

  @Column(name = "direccion", length = 500)
  private String direccion;

  @Column(nullable = false)
  private Boolean activo = Boolean.TRUE;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "plan_id")
  private Plan plan;

  // ID de la suscripción activa (no FK directa para evitar circular reference)
  @Column(name = "suscripcion_activa_id")
  private Long suscripcionActivaId;

  @Column(name = "creado_en", nullable = false)
  private Instant creadoEn;

  @PrePersist
  protected void onCreate() {
    this.creadoEn = Instant.now();
    this.activo = Boolean.TRUE;
  }
}
