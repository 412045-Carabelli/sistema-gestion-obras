package com.usuarios.entity;

import com.common.audit.AbstractAuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Persistent entity that represents the platform users. Extends the
 * {@link AbstractAuditableEntity} to inherit the auditing metadata automatically.
 */
@Entity
@Table(name = "usuarios")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Usuario extends AbstractAuditableEntity {

    /** Identifier generated automatically for the user. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Person full name. */
    @NotBlank
    @Size(max = 150)
    private String nombre;

    /** Contact email address, unique per user. */
    @Email
    @NotBlank
    @Size(max = 150)
    @Column(unique = true, nullable = false)
    private String email;

    /** Optional phone number. */
    @Size(max = 30)
    private String telefono;

    /** Flag that signals whether the user is active. */
    @Builder.Default
    private Boolean activo = Boolean.TRUE;
}
