package com.clientes.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name="clientes") @Data
public class Cliente {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String nombre;
    @Column(name = "id_empresa")
    private Long idEmpresa;
    private String contacto, cuit, telefono, email;

    @Column(name = "condicion_iva", nullable = false)
    private String condicionIVA;

    private Instant creadoEn = Instant.now();

    @Column(name = "ultima_actualizacion")
    private Instant ultimaActualizacion;

    @Column(name = "tipo_actualizacion")
    private String tipoActualizacion;

    @PrePersist
    public void prePersist() {
        if (this.condicionIVA == null) {
            this.condicionIVA = "Consumidor Final";
        }
        marcarAuditoria("CREATE");
    }

    @PreUpdate
    public void preUpdate() {
        if (this.condicionIVA == null) {
            this.condicionIVA = "Consumidor Final";
        }
        marcarAuditoria("UPDATE");
    }

    @PreRemove
    public void preRemove() {
        marcarAuditoria("DELETE");
    }

    private void marcarAuditoria(String tipo) {
        this.ultimaActualizacion = Instant.now();
        this.tipoActualizacion = tipo;
    }
}
