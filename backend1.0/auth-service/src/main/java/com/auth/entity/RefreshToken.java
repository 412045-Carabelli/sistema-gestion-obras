package com.auth.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "usuario_id", nullable = false)
  private Usuario usuario;

  @Column(nullable = false, unique = true, length = 500)
  private String token;

  @Column(name = "expira_en", nullable = false)
  private Instant expiraEn;

  @Column(nullable = false)
  private Boolean revocado = Boolean.FALSE;

  @Column(name = "ip_origen", length = 45)
  private String ipOrigen;

  @Column(name = "creado_en", nullable = false)
  private Instant creadoEn;

  @PrePersist
  protected void onCreate() {
    this.creadoEn = Instant.now();
    this.revocado = Boolean.FALSE;
  }

  public boolean esValido() {
    return !this.revocado && Instant.now().isBefore(this.expiraEn);
  }
}
