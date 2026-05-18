package com.auth.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_auth")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditAuth {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "usuario_id")
  private Long usuarioId;

  @Column(nullable = false, length = 255)
  private String email;

  @Column(nullable = false, length = 50)
  private String accion;  // LOGIN_OK, LOGIN_FAIL, REGISTER, CHANGE_PASSWORD, LOGOUT, REFRESH

  @Column(nullable = false, length = 45)
  private String ip;

  @Column(name = "user_agent", length = 500)
  private String userAgent;

  @Column(length = 500)
  private String detalle;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @PrePersist
  protected void onCreate() {
    this.createdAt = Instant.now();
  }
}
