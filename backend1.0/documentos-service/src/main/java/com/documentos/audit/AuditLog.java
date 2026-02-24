package com.documentos.audit;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "auditoria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String modulo;

    @Column(name = "tipo_request", nullable = false, length = 10)
    private String tipoRequest;

    @Column(nullable = false, length = 255)
    private String endpoint;

    @Column(name = "tabla_modificada", length = 80)
    private String tablaModificada;

    @Column(name = "codigo_respuesta")
    private Integer codigoRespuesta;

    @Column(name = "respuesta", columnDefinition = "TEXT")
    private String respuesta;

    @Column(name = "fecha_hora", nullable = false)
    private Instant fechaHora;

    @Column(name = "usuario", length = 120)
    private String usuario;

    @Column(name = "ip", length = 60)
    private String ip;
}
