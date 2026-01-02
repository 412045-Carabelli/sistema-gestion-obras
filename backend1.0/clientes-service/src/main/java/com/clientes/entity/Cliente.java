package com.clientes.entity;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name="clientes") @Data
public class Cliente {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String nombre;
    private Long id_empresa;
    private String contacto, cuit, telefono, email, direccion;
    @JsonProperty("condicionIVA")
    @JsonAlias({"condicionIva", "condicion_iva"})
    @Enumerated(EnumType.STRING)
    @Column(name = "condicion_iva")
    private CondicionIva condicionIva = CondicionIva.RESPONSABLE_INSCRIPTO;
    private Boolean activo = Boolean.TRUE;
    private Instant creadoEn = Instant.now();

    @Column(name = "ultima_actualizacion")
    private Instant ultimaActualizacion;

    @Column(name = "tipo_actualizacion")
    private String tipoActualizacion;

    @PrePersist
    public void prePersist() {
        marcarAuditoria("CREATE");
    }

    @PreUpdate
    public void preUpdate() {
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

    // Compatibilidad con tests/DTOs que usan el nombre en mayúsculas
    @JsonProperty("condicionIVA")
    @JsonAlias({"condicionIva", "condicion_iva"})
    public void setCondicionIva(String condicion) {
        if (condicion == null) {
            this.condicionIva = CondicionIva.RESPONSABLE_INSCRIPTO;
            return;
        }
        try {
            this.condicionIva = CondicionIva.valueOf(condicion.toUpperCase().replace(" ", "_"));
        } catch (IllegalArgumentException ex) {
            this.condicionIva = CondicionIva.RESPONSABLE_INSCRIPTO;
        }
    }

    @JsonProperty("condicionIVA")
    public String getCondicionIVA() {
        return this.condicionIva != null ? this.condicionIva.name() : null;
    }

}
