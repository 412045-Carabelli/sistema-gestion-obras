package com.auth.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "usuario_organizacion")
@IdClass(UsuarioOrganizacionId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioOrganizacion {

  @Id
  @Column(name = "usuario_id")
  private Long usuarioId;

  @Id
  @Column(name = "organizacion_id")
  private Long organizacionId;

  @Column(nullable = false, length = 50)
  private String rol = "ADMIN";

  @Column(nullable = false)
  private Boolean activo = Boolean.TRUE;
}
