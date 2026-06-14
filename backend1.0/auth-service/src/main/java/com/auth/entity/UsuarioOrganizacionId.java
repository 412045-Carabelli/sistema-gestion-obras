package com.auth.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UsuarioOrganizacionId implements Serializable {
  private Long usuarioId;
  private Long organizacionId;
}
