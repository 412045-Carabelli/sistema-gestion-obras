package com.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "push_subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(name = "organizacion_id", nullable = false)
    private Long organizacionId;

    @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String endpoint;

    @Column(name = "p256dh", nullable = false, length = 500)
    private String p256dh;

    @Column(name = "auth_key", nullable = false, length = 500)
    private String authKey;

    @Column(nullable = false)
    private Boolean activo = Boolean.TRUE;

    @Column(name = "creado_en")
    private Instant creadoEn;

    @PrePersist
    protected void onCreate() {
        this.creadoEn = Instant.now();
    }
}
