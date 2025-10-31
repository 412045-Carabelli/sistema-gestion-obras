package com.empresas.entity;

import com.common.audit.AbstractAuditableEntity;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Entity that represents the company catalog and ties users to obras through
 * lightweight identifiers to keep the microservice isolated.
 */
@Entity
@Table(name = "empresas")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Empresa extends AbstractAuditableEntity {

    /** Primary identifier. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Company legal name. */
    @NotBlank
    @Size(max = 200)
    private String razonSocial;

    /** Foreign key to the owning user in the usuarios service. */
    @NotNull
    private Long usuarioId;

    /** Flag indicating if the company is active. */
    @Builder.Default
    private Boolean activa = Boolean.TRUE;

    /** Collection of obra identifiers associated with the company. */
    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "empresa_obras", joinColumns = @JoinColumn(name = "empresa_id"))
    @Column(name = "obra_id")
    private List<Long> obras = new ArrayList<>();
}
