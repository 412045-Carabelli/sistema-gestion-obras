package com.clientes.entity;

import com.common.audit.AbstractAuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Entity that represents the customer catalog extending the shared auditing
 * capabilities.
 */
@Entity
@Table(name = "clientes")
@Data
@EqualsAndHashCode(callSuper = true)
public class Cliente extends AbstractAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private Long id_empresa;

    private String contacto;

    private String cuit;

    private String telefono;

    private String email;

    private Boolean activo = Boolean.TRUE;
}
