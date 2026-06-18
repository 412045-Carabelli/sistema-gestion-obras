package com.obras.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "grupos_obras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrupoObra {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "organizacion_id", nullable = false)
  private Long organizacionId;

  @Column(name = "id_cliente", nullable = false)
  private Long idCliente;

  @Column(nullable = false, length = 255)
  private String nombre;

  @Builder.Default
  private Boolean activo = Boolean.TRUE;

  @Column(name = "creado_en", updatable = false)
  private Instant creadoEn;

  @Column(name = "ultima_actualizacion")
  private Instant ultimaActualizacion;

  @Column(name = "tipo_actualizacion")
  private String tipoActualizacion;

  @PrePersist
  protected void onCreate() {
    this.creadoEn = Instant.now();
    this.tipoActualizacion = "CREATE";
  }

  @PreUpdate
  protected void onUpdate() {
    this.ultimaActualizacion = Instant.now();
    this.tipoActualizacion = "UPDATE";
  }
}
